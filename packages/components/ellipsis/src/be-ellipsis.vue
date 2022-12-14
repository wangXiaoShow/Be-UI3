<template>
  <be-tooltip
    :content="content"
    placement="top"
  >
    <span
      v-bind="attrs"
      :style="styleStr"
      @click="expandTriggerFunc"
      v-html="state.textInner"
    />
  </be-tooltip>
</template>

<script lang="ts">
  import { defineComponent, reactive, watchEffect, ref, getCurrentInstance } from 'vue'
  import {BeTooltip} from '@be-ui/components'
  import { IEllipsis } from './be-ellipsis-type'

  export default defineComponent({
    name: 'BeEllipsis',
    components: {
        BeTooltip
    },
    props: {
      /**
       * 提示显示内容
       */
      content: {
        type: String,
        default: '',
      },
      /**
       * 显示内容
       */
      text: {
        type: String,
        default: '',
      },
      /**
       * 点击展开
       */
      expandTrigger: {
        type: Boolean,
        default: false,
      },
      /**
       * 多行省略
       */
      lineClamp: {
        type: Number,
        default: null,
      },
      /**
       * 缩略字符数
       */
      elpNum: {
        type: Number,
        default: 5,
      },
      /**
       * 缩略位置
       */
      placement: {
        type: String,
        default: 'left',
      },
    },
    setup(props) {
      const internalInstance = getCurrentInstance() as IEllipsis
      // 定义state
      const state = reactive({
        isExpand: false,
        textCache: '',
        textInner: props.text,
      })
      /**
       * 监听文字变化，根据方向处理文字
       */
      const handleText = (): void => {
        if (props.elpNum === 0) return
        if (props.placement === 'left') {
          state.textInner = props.text?.slice(0, props.text?.length - props.elpNum) + '...'
        }
        if (props.placement === 'center') {
          let elpNumCenter = props.elpNum / 2
          let lenCenter = props.text?.length / 2
          let subStrHead = props.text?.substr(0, lenCenter - elpNumCenter)
          let subStrFoot = props.text?.substr(lenCenter + elpNumCenter, props.text.length)
          state.textInner = subStrHead + '...' + subStrFoot
        }
        if (props.placement === 'right') {
          state.textInner = '...' + props.text.substring(props.elpNum, props.text.length)
        }
      }
      watchEffect(() => {
        state.textCache = props.text
        handleText()
      })
      /**
       * 展开方法
       */
      const styleStr = ref(``)
      styleStr.value = !props.lineClamp
        ? ''
        : `
      -webkit-line-clamp:${props.lineClamp};
      display:-webkit-inline-box;
      -webkit-box-orient:vertical;
      overflow:hidden;`
      const expandTriggerFunc = (): void => {
        if (!props.expandTrigger) return
        state.isExpand = !state.isExpand
        styleStr.value = state.isExpand
          ? ''
          : `
      -webkit-line-clamp:${props.lineClamp};
      display:-webkit-inline-box;
      -webkit-box-orient:vertical;
      overflow:hidden;`
        state.isExpand && (state.textInner = state.textCache)
        !state.isExpand && handleText()
      }
      return {
        state,
        styleStr,
        handleText,
        expandTriggerFunc,
        attrs: internalInstance.attrs,
      }
    },
  })
</script>
