const { createApp, reactive, toRefs } = Vue;

const app = createApp({
  setup() {
    const data = reactive({
      imgs: [], // 图片数据列表
      showPreview: false, // 是否预览
      previewImg: '', // 当前预览的图片
      previewIndex: null, // 当前预览的图片索引值
      mask: null, // 预览图片遮罩层选择器
      startX: null,
    })
    // 封装图片转码方法一
    const getObjectURL= (file) => {
      let url = null;
      if (file) {
        if (window.createObjectURL != undefined) {
          // basic
          url = window.createObjectURL(file);
        } else if (window.URL != undefined) {
          // mozilla(firefox)
          url = window.URL.createObjectURL(file);
        } else if (window.webkitURL != undefined) {
          // webkit or chrome
          url = window.webkitURL.createObjectURL(file);
        }
      }
      return url;
    };
    // 图片压缩
    const hanldleCompressor = (file) => {
      return new window.Promise((resolve) => {
        // compressorjs 默认开启 checkOrientation 选项
        // 会将图片修正为正确方向
        // console.log('+++++++++++++++++++', file);
        // 根据不同的原始图片大小设置不同的压缩率
        let sizeMB = file.size / 1024 / 1024
        let quality = 1
        if (sizeMB > 1) {
          quality = 0.8
        } else if (sizeMB > 2) {
          quality = 0.6
        } else if (sizeMB > 4) {
          quality = 0.5
        }
        new Compressor(file, {
          quality: quality,
          success: resolve,
          error(err) {
            console.log(err.message);
          },
        });
      })
    }
    // 上传至服务器 此处举例上传至七牛
    // 原理：先获取七牛 token，创建并发起请求提交 FormData
    const uploadToQiNiu = (file) => {
      return api.resolve('getQiNiuToken').then(res => {
        if(res?.code === 1) {
          console.log('七牛参数', res);
          const formData = new FormData();
          const dataType = file.type.split("/").pop()
          const key = file.lastModified + "." + dataType
          formData.append("key", key)
          formData.append("token", res.data.token)
          formData.append("file", file)
          // 上传图片到七牛云
          return axios({
            method: "POST",
            headers: {
              "Content-Type": "multipart/form-data",
            },
            url: "https://up-z2.qiniup.com",
            data: formData,
          })
        }
      })
    }
    // 删除图片事件
    const emptyClick = (index) => {
      data.imgs.splice(index, 1)
    }
    // 图片预览点击事件
    const imgClick = (index) => {
      data.showPreview = true
      data.previewImg = data.imgs[index]
      data.previewIndex = index
      data.mask.style.display = 'block'
    }
    // 遮罩层点击事件
    const maskClick = () => {
      data.showPreview = false
      setTimeout(() => {
        data.mask.style.display = 'none'
      }, 300);
    }
    // 上传图标事件
    const upload = (e) => {
      const files = e.target.files || e.dataTransfer.files;
      // 封装图片转码方法二
      // const reads = new FileReader();
      // reads.readAsDataURL(files[0]);
      // reads.onload = () => {
      //   // 图片的 base64 格式
      //   data.imgs.push(reads.result)
      // };

      console.log(e.target.value);
      console.log(files[0]);
      // 压缩并上传至服务器
      // hanldleCompressor(files[0]).then(res => {
      //   console.log('压缩后的图片', res);
      //   uploadToQiNiu(res).then(res => {
      //     console.log('返回的图片', res);
      //     if(res?.status === 200) {
      //       data.imgs.push(res.data.source)
      //     }
      //   })
      // })

      // 此处只展示本地图片
      if (files[0]) {
        data.imgs.push(getObjectURL(files[0]))
      }
      // 解决无法重复上传同一张图片的问题
      e.target.value = null
    }
    const touchStart = (e) => {
      data.startX = e.touches[0].pageX
    }
    const touchEnd = (e) => {
      const slidX = e.changedTouches[0].pageX - data.startX
      if (slidX < -30) {
        if (data.previewIndex >= data.imgs.length -1) {
          data.previewIndex = 0
        } else {
          data.previewIndex += 1
        }
      } else {
        if (data.previewIndex <= 0) {
          data.previewIndex = data.imgs.length -1
        } else {
          data.previewIndex -= 1
        }
      }
      data.previewImg = data.imgs[data.previewIndex]
    }
    return {
      ...toRefs(data),
      upload,
      emptyClick,
      imgClick,
      maskClick,
      touchStart,
      touchEnd
    }
  }
})

app.mount("#app");