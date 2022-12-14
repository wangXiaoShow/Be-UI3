/* * @be-loading.vue * @deprecated 公共的loading组件 * @author czh * @update (czh 2021/6/11) */
<template>
  <div
    :id="`be_load_${uid}`"
    :style="`position: absolute;height: ${containerHeight};width: ${containerWidth};left: ${containerLeft};top: ${containerTop};`"
  >
    <transition name="be-fade-in-linear">
      <div
        v-if="isShowLoaderInner"
        class="be-load flex-col"
        :class="`${customClass} ${isFullScreenStyle}`"
        :style="`
                 background-color: ${mdColor};
                 left: ${leftLoader};
                 top: ${topLoader};
                 width:${loaderWidth};
                 height:${loaderHeight}`"
      >
        <!--loading动画-->
        <BeLoadingAnimate />
        <span
          v-if="text"
          class="be-load--text"
          :style="`color:${colorText};`"
          :class="`be-load--text__${sizeLoader}`"
        >{{ text }}</span>
      </div>
    </transition>
  </div>
</template>
<script lang="ts">
  /**
   * 公共的loading组件
   */
  import BeLoadingAnimate from './be-loading-elm.vue'
  import {
    computed,
    defineComponent,
    ref,
    nextTick,
    getCurrentInstance,
    watch,
    ComputedRef,
    watchEffect,
      provide,
  } from 'vue'
  import { ILoadingInst, IPosStyle } from './be-loading-type'

  export default defineComponent({
    name: 'BeLoading',
    components: { BeLoadingAnimate },
    provide() {
      return {
        $$BeLoading: this,
      }
    },
    props: {
      /**
       * 延时loading (完成)
       */
      delay: {
        type: Number,
        default: 0,
      },
      /**
       * loading开启 (完成)
       */
      show: {
        type: Boolean,
        default: false,
      },
      /**
       * 颜色 (完成)
       */
      color: {
        type: String,
        default: '#4F60A7FF',
      },
      /**
       * 文字颜色 (完成)
       */
      colorText: {
        type: String,
        default: 'black',
      },
      /**
       * 自定义文本 (完成)
       */
      text: {
        type: String,
        default: '',
      },
      /**
       * 按钮圆角 (完成)
       */
      round: {
        type: [Number, String],
        default: 5,
      },
      /**
       * 尺寸 (完成) large  default small
       */
      size: {
        type: String,
        default: 'default',
      },
      /**
       * 是否开启小圆角背景 (完成)
       */
      isBackground: {
        type: Boolean,
        default: true,
      },
      /**
       * 背景颜色 (完成)
       */
      mdColor: {
        type: String,
        default: 'rgba(255,255,255,.5)',
      },
      /**
       * 自定义主题样式类 (完成)
       */
      customClass: {
        type: String,
        default: '',
      },

      /**
       * 是否扩展至body下全屏 serX (完成)
       */
      isFullScreen: {
        type: Boolean,
        default: false,
      },
      /**
       * 自定义渲染内容 (完成)
       */
      customRender: {
        type: Function,
        default: () => null,
      },
    },
    setup(props) {
      // loading动画left
      const left = ref('50%')
      // loading动画top
      const top = ref('50%')
      // loading动画遮罩容器left
      const leftLoader = ref('')
      // loading动画遮罩容器top
      const topLoader = ref('')
      // loading延时渲染定时器
      const timer: any = ref(null)
      // loading尺寸
      const sizeLoader = computed(() => props.size)
      // loading显示控制
      const containerHeight = ref('')
      const containerWidth = ref('')
      const containerLeft = ref('50%')
      const containerTop = ref('50%')
      const isBackgroundStyle = computed(() => (props.isBackground ? 'be-load__bg' : ''))
      const isFullScreenStyle = ref<string | ComputedRef>('')
      provide('isBackgroundStyle',isBackgroundStyle)
      provide('customRender',props.customRender)
      provide('color',props.color)
      provide('round',props.round)
      provide('sizeLoader',sizeLoader)
        /******************************************** loading位置、宽高设置 ************************************/
      // loading动画遮罩容器width
      const loaderWidth = ref('')
      // loading动画遮罩容器height
      const loaderHeight = ref('')
      /******************************************** loading的文字、宽高设置 ************************************/
      // loading文字left
      const leftTxt = ref('')
      // loading文字top
      const topTxt = ref('')
      /**
       * 计算文字位置
       */
      const setText = () => {
        if (props.text) {
          // 根据插槽元素数据，计算文字位置
          nextTick(() => {
            let loaderElem: HTMLElement | null = document.querySelector('.be-load')
            if (!loaderElem) return
            let loaderElemHeight = Number(window.getComputedStyle(loaderElem).height.split('px')[0])
            leftTxt.value = left.value
            let topVal: null | string[] = null
            if (top.value.split('px').length > 1) {
              topVal = top.value.split('px')
              topTxt.value = Number(topVal[0]) + loaderElemHeight / 2 + 20 + 'px'
            } else {
              topVal = top.value.split('%')
              topTxt.value = `calc(${Number(topVal[0])}% + ${loaderElemHeight / 2 + 20}px)`
            }
          })
        }
      }
      /******************************************** 获取loading 目标 元素相对浏览器的大小、位置 ************************************/
      /**
       * 获取loading 目标 元素相对浏览器的大小、位置
       * @param {Element} slotElem - 插槽元素对象，这里是body
       * @return {Object} 位置、大小信息
       */
      const getAbsolutePosition = (slotElem: HTMLElement): IPosStyle | null => {
        //如果函数没有传入值的话返回对象为空的
        if (!slotElem) return null
        let w: number = slotElem.offsetWidth,
          h: number = slotElem.offsetHeight
        if (h === 0 || w === 0) {
          //console.warn('You need to set the width and height attribute for the body element')
        }
        //从目标元素开始向外遍历，累加top和left值
        let t: number, l: number
        for (
          t = slotElem.offsetTop, l = slotElem.offsetLeft;
          (slotElem = slotElem.offsetParent as HTMLElement);

        ) {
          t += slotElem.offsetTop
          l += slotElem.offsetLeft
        }
        let r: number = document.body.offsetWidth - w - l
        let b: number = document.body.offsetHeight - h - t
        return { width: w, height: h, top: t, left: l, right: r, bottom: b }
      }
      /******************************************** 初始化组件 ************************************/
      const internalInstance = getCurrentInstance() as ILoadingInst
      /**
       * 初始化组件
       */
      const initComp = (): void => {
        isFullScreenStyle.value = computed(() => (props.isFullScreen ? 'be-load__full' : '')).value
        // 全屏显示时
        if (props.isFullScreen) {
          return
        }
        getParentDomAttr(internalInstance?.proxy.$el.parentElement)
      }
      /************************************* 不扩展全屏时，使用父节点进行定位 ************************************/
      /**
       * 获取父节点信息，进行宽高定位
       * @param parentDom
       */
      const getParentDomAttr = (parentDom: HTMLElement): void => {
        if (!parentDom) return
        const parentStylr: IPosStyle | null = getAbsolutePosition(parentDom)
        containerWidth.value = window.getComputedStyle(parentDom).width
        containerHeight.value = window.getComputedStyle(parentDom).height
        if (parentStylr) {
          // containerLeft.value = parentStylr.left + 'px'
          // containerTop.value = parentStylr.top + 'px'
          containerLeft.value = '0px'
          containerTop.value = '0px'
        }
        setText()
      }
      /************************************* 延迟显示 ************************************/
      const isShowLoader = computed(() => props.show)
      const isShowLoaderInner = ref<boolean>(false)
      const delayShow = (show: boolean) => {
        if (show) {
          timer.value = setTimeout(() => {
            nextTick(() => {
              isShowLoaderInner.value = show
              initComp()
            })
          }, props.delay)
        } else {
          isShowLoaderInner.value = show
          clearTimeout(timer)
          timer.value = null
        }
      }
      watchEffect(() => {
        let show: boolean = props.show
        delayShow(show)
      })
      watch(isShowLoader, (nVal: any) => {
        delayShow(nVal)
      })
      return {
        uid: internalInstance.uid,
        containerHeight,
        containerWidth,
        containerLeft,
        containerTop,
        isFullScreenStyle,
        leftLoader,
        topLoader,
        loaderWidth,
        loaderHeight,
        leftTxt,
        topTxt,
        left,
        top,
        sizeLoader,
        isShowLoader,
        isShowLoaderInner,
        isBackgroundStyle,
      }
    },
  })
</script>
