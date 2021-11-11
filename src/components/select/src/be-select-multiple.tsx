import {
    computed,
    defineComponent,
    reactive,
    ref,
    getCurrentInstance,
    VNode,
    watch,
    onMounted, nextTick, useAttrs
} from 'vue'
import '../../../assets/style/be-select.scss';
import {IOption, ISelect} from "../src/be-select-type";
import BeInputSelect from "../../autocomplete/src/be-input-select.vue";
import BePopover from "../../popover/src/be-popover.vue";
import BeIcon from "../../svg-icon/src/be-icon.vue";
import {IInputSelectFunc} from "../../autocomplete/src/be-autocomplete-type";
import {debounce, getUuid, isFunction, isString, mapToArr} from "../../../utils/common";

export default defineComponent({
    name: "be-select",
    components: {BeInputSelect, BePopover, BeIcon},
    emits: [
        'update:modelValue',
        'select',
        'focus',
        'blur',
        'openChange',
        'clear',
        'search',
        'MouseEnter',
        'MouseLeave',
        'scroll',
    ],
    props: {
        /**
         * 整体禁用
         */
        disabled: {
            type: Boolean,
            default: false
        },
        /**
         * 大小
         * @values 'mini' | 'medium' | 'large'
         */
        size: {
            type: String,
            default: 'medium'
        },
        /**
         * 數據list
         */
        list: {
            type: Array,
            default: () => []
        },
        /**
         * 绑定值 （完成）
         */
        modelValue: {},
        /**
         * 下拉label
         */
        labelValue: {
            type: String,
            default: 'label'
        },
        /**
         * 下拉key
         */
        keyValue: {
            type: String,
        },
        /**
         * placeholder
         */
        placeholder: {
            type: String,
            default: '请选择'
        },
        /**
         * 可清空
         */
        clear: {
            type: Boolean,
            default: false
        },
        /**
         * 下拉图标
         */
        selectIcon: {
            type: String,
            default: 'under'
        },
        /**
         * 开启分组
         */
        group: {
            type: Boolean,
            default: false
        },
        /**
         * 动态扩展
         */
        extend: {
            type: Boolean,
            default: false
        },
        /**
         * 开启搜索匹配
         */
        search: {
            type: Boolean,
            default: false
        },
        /**
         * 搜索匹配方法
         */
        searchFunc: {
            type: Function,
        },
        /**
         * 搜索排序方法
         */
        sortFunc: {
            type: Function,
        },
        /**
         * 开启远程搜索
         */
        remote: {
            type: Boolean,
            default: false
        },
        /**
         * 远程搜索方法
         */
        remoteFunc: {
            type: Function,
        },
        /**
         * 指定样式
         */
        customClass: {
            type: String,
            default: ''
        },
        /**
         * 開啓多選
         */
        multiple: {
            type: Boolean,
            default: false
        }

    },
    setup(props, ctx) {
        // 當前實例
        const internalInstance = getCurrentInstance() as ISelect
        // 當前實例uid
        const uid = internalInstance.uid
        // 下拉數據列表
        const dataList = ref<Array<any>>([])
        // 下拉數據列表監聽
        const list = computed(() => {
            return props.list
        })
        watch(list, (nVal, oVal) => {
            if (nVal !== oVal) {
                handleList(props.list)
            }
        })
        // 列表緩存
        let listCache: Array<any> = []
        /**
         * 處理列表數據
         * @param {Array} propList - 数据列表
         */
        const handleList = (propList: Array<any>): void => {
            const list = JSON.parse(JSON.stringify(propList))
            // 分组数据处理逻辑
            if (props.group) {
                let arr: Array<any> = []
                list.forEach((res: any) => {
                    res.isSelect = false
                    let group = {...res}
                    delete group.children
                    arr.push(group)
                    if (res.children?.length > 0) {
                        res.children.forEach((childRes: any) => {
                            arr.push(childRes)
                        })
                    }
                })
                dataList.value = arr
            } else {
                // 沒有指定key，則生成
                if (!props.keyValue) {
                    list.forEach((val: any) => {
                        val.isSelect = false
                        val.id = getUuid()
                    })
                }
                if (props.keyValue) {
                    list.forEach((val: any) => {
                        val.isSelect = false
                        if (!val[props.keyValue || 'id']) {
                            val[props.keyValue || 'id'] = getUuid()
                        }
                    })
                }
                dataList.value = list
            }
            listCache = JSON.parse(JSON.stringify(dataList.value))
        }

        /**************************************** 樣式相關處理 ************************************/
            // 只读
        const readonlyInput = ref<boolean>(true)
        if (props.search) {
            readonlyInput.value = false
        }
        // cursor 的样式
        let cursor = props.disabled ? 'not-allowed' : readonlyInput.value ? 'pointer' : ''
        // 输入建议下拉样式
        let selectStyle = reactive({width: '0px'})
        /**
         * 计算输入建议下拉框位置
         */
        const computedPositon = (): void => {
            const $eventDom: HTMLElement | null = document.getElementById(`be-select-body${uid}`)
            if (!$eventDom) return
            selectStyle.width = Number(window.getComputedStyle($eventDom).width.split('px')[0]) + 'px'
        }
        /**
         * 更新popover
         */
        const updatePopover = (): void => {
            const curInstPopover = internalInstance.refs.beSelectPopover as IInputSelectFunc
            curInstPopover.computePosition(null, 'update')
        }
        /**************************************** 各種事件方法 ************************************/
        // 當前實例屬性attr
        const curAttrs = useAttrs()
        // 圖標類型
        const iconType = ref<string>(computed(() => props.selectIcon).value)
        /**
         * focus 事件处理方法
         * @param {Event} event - 事件对象
         */
        const handleFocus = (event: Event): void => {
            (event.target as HTMLInputElement).querySelector('input')?.focus()
            /** focus 事件
             * @event focus
             * @param {Event} event - 事件对象
             */
            ctx.emit('focus', event)
        }
        /**
         * blur 事件处理方法
         * @param {Event} event - 事件对象
         */
        const handleBlur = (event: Event): void => {
            /** 输入 blur 事件
             * @event blur
             * @param {Event} event - 事件对象
             */
            ctx.emit('blur', event)
        }
        /**
         * 下拉列表展開關閉方法
         * @param {Boolean} showPopover - popover展開狀態
         */
        const selectOpenChange = (showPopover: boolean): void => {
            // 增加滾動監聽
            if (showPopover && curAttrs.onScroll) {
                nextTick(() => {
                    const dom = document.getElementById(`be_select_option_container_${uid}`)
                    dom?.addEventListener('scroll', handleScroll)
                })

            }
            /** 输入 openChange 事件
             * @event blur
             * @param {Boolean} showPopover - popover展開狀態
             */
            ctx.emit('openChange', showPopover)

        }
        /**
         * 修改圖標方法。鼠標移入 變成清楚圖標
         * @param {String} type - 圖標類型
         */
        const changeIcon = (type: string | undefined): void => {
            if (props.clear && props.modelValue) {
                iconType.value = type || 'error'
                return
            }
        }
        /**
         * 處理鼠標移入
         * @param {Event} event - 事件对象
         */
        const handleMouseEnter = (event: Event): void => {
            changeIcon(undefined)
            /** MouseEnter 事件
             * @event MouseEnter
             * @param {Event} event - 事件对象
             */
            ctx.emit('MouseEnter', event)
        }
        /**
         * 處理鼠標移出
         * @param {Event} event - 事件对象
         */
        const handleMouseLeave = (event: Event): void => {
            changeIcon(props.selectIcon)
            /** MouseLeave 事件
             * @event MouseLeave
             * @param {Event} event - 事件对象
             */
            ctx.emit('MouseLeave', event)
        }
        /**
         * 滾動方法
         */
        const handleScroll = (): void => {
            ctx.emit('scroll')
        }
        /**
         * 滾動條事件監聽方法
         */
        const addScrollEvt = (): void => {
            const dom = document.getElementById(`be_select_option_container_${uid}`)
            dom?.addEventListener('scroll', handleScroll)
        }

        /**************************************** 擴展渲染選項方法 ************************************/
        /**
         * 擴展渲染
         * 不支持分組
         */
        const renderExtendElm = (): VNode | void => {
            if (props.extend && !props.group) {
                return (
                    <div class={`
                        be-select-option__extend`}>
                        <be-input value={addItem.value} onInput={handleInput}>
                        </be-input>
                        <be-icon icon='add' onClick={addItemToList}></be-icon>
                    </div>
                )
            }
        }
        // 新增的下拉選項數據
        const addItem = ref<string>('')
        /**
         * 新增的下拉選項數據賦值方法
         * @param {String} value - 新增選項值
         */
        const handleInput = (value: string): void => {
            addItem.value = value
        }
        /**
         * 新增選綫組裝，並加入到列表中
         */
        const addItemToList = (): void => {
            if (addItem.value) {
                let item: IOption = {}
                let keyValue = props.keyValue || 'id'
                let labelValue = props.keyValue || 'label'
                item[keyValue] = getUuid()
                item[labelValue] = addItem.value
                dataList.value.push(item)
                addItem.value = ''
            }
        }

        /**************************************** 輸入匹配建議相關方法 ************************************/
            // 远程时设置为不触发，由input事件内手动渲染
        const trigger = ref<string>('click')
        if (props.remote && isFunction(props.remoteFunc)) {
            trigger.value = 'none'
        }
        // loading顯示標識
        const loading = ref<boolean>(false)
        /**
         * 匹配输入建议
         * @param {string} value - 輸入值
         * @param {Array} ordData - 原始數據集
         */
        const matchSuggestions = (value: string, ordData: Array<any>): void => {
            const filter = (value: string, ordData: Array<any>, labelValue: string) => {
                let arr = value ? ordData.filter(
                    (val: any) => {
                        return (val[labelValue].toString().toLowerCase().indexOf(value.toLowerCase()) >= 0);
                    }
                ) : ordData
                return arr.length > 0 ? arr : ordData
            }
            // dataList.value
            // 匹配過濾
            let filterRes = props.searchFunc ? props.searchFunc(value, ordData, props.labelValue) : filter(value, ordData, props.labelValue)
            // 排序調用排序
            if (props.sortFunc) {
                filterRes.sort(props.sortFunc)
            }
            ctx.emit('search', filterRes)
            dataList.value = filterRes
        }
        /**
         * 输入事件
         * @param {Event} event - 事件对象
         */
        const inputChange = (event: Event): void | Function => {
            // 更新值
            const $eventDom = (event.target as HTMLInputElement)
            inputMultiple.value = $eventDom.value
            // 改变文字宽度
            txtWidth.value = textWidth($eventDom.value);

            const curInstPopover = internalInstance.refs.beSelectPopover as IInputSelectFunc
            // 开启远程搜索时
            if (props.remote && isFunction(props.remoteFunc) && props.remoteFunc) {
                const handleRemote = function () {
                    // 为空，关闭下拉 直接返回
                    if (!$eventDom.value) {
                        curInstPopover.close()
                        return;
                    }
                    // 手动触发下拉显示
                    curInstPopover.changeDisplay(true)
                    loading.value = true
                    // 执行回调拿数据
                    props.remoteFunc && props.remoteFunc((query: Array<any>) => {
                        loading.value = false
                        // 处理数据并进行筛选
                        handleList(query)
                        matchSuggestions($eventDom.value, listCache)

                    })
                }
                return debounce(handleRemote, 300).call(this)
            }
            // 匹配輸入建議
            matchSuggestions($eventDom.value, listCache)
        }
        /**************************************** 多選相關方法 ************************************/
            // tag 列表
        const tagList = ref<Array<any>>([])
        // 多選時，維護的内部輸入
        const inputMultiple = ref<string>('')
        // 输入框宽度
        const txtWidth = ref<number>(0)
        // 列表显示label
        const label = props.labelValue || 'label'
        // 列表显示keyid
        const keyId = props.keyValue || 'id'
        let selectMap = new Map()
        /**
         * 下拉搜索选择事件方法
         * @param {Object } value - 选中后值
         * @param {Number} index - 点击索引
         */
        const handleSelect = (value: any, index: number): void => {
            const itemLabel = value[keyId]
            if (selectMap.has(itemLabel)) {
                selectMap.delete(itemLabel)
                value.isSelect = false
            } else {
                selectMap.set(itemLabel, value)
                value.isSelect = true
            }
            /** 选中 select 事件
             * @event select
             * @param {Object} value - 点击对象数据
             * @param {Number} index - 点击的对应列表索引
             */
            ctx.emit('select', value, index)
            updateValue()
            updatePopover()
        }
        /**
         * 更新數據方法
         */
        const updateValue = (): void => {
            const res = JSON.parse(JSON.stringify(mapToArr(selectMap)))
            tagList.value = res
            ctx.emit('update:modelValue', res)
        }
        /**
         * 清除方法
         */
        const handleClear = (): void => {
            selectMap = new Map()
            tagList.value = []
            // 多選時，維護的内部輸入
            inputMultiple.value = ''
            // 输入框宽度
            txtWidth.value = 0
            /** 输入 clear 事件
             * @event clear
             */
            ctx.emit('clear')
            updateValue()
            changeIcon(props.selectIcon)
            dataList.value = listCache
        }
        /**
         * 初始化taglist
         */
        const initTagList = () => {
            tagList.value = props.modelValue as Array<any>
            tagList.value.forEach((tag:any)=>{
                // 更新 selectMap
                selectMap.set(tag[keyId], tag)
                // 更新 dataList選中状态
                setSelectState(true,tag[keyId])
            })
        }
        /**
         * 遍历dataList 设置选中状态
         * @param {boolean} state - 状态值
         * @param {Object} match - 匹配对象
         */
        const setSelectState = (state:boolean,match:any):void=>{
            dataList.value.forEach((select:any)=>{
                if(select[keyId] === match){
                    select.isSelect = state
                }
            })
        }
        /**
         * 根据输入文字计算宽度
         * @param text
         */
        const textWidth = (text: string) => {
            let sensor = document.createElement('a');
            sensor.innerHTML = text;
            let body = document.getElementsByTagName('body')[0];
            body.appendChild(sensor);
            let width = sensor.offsetWidth;
            body.removeChild(sensor);
            return width;
        }
        /**
         * 清除tag
         * @param {Object } value - 选中后值
         */
        const closeTag = (value: any): void => {
            value.isSelect = false
            selectMap.delete(value[keyId])
            setSelectState(false,value[keyId])
            updateValue()
            updatePopover()
        }
        onMounted(() => {
            handleList(props.list)
            addScrollEvt()
            initTagList()

        })
        /**
         * 渲染tag
         */
        const renderTags = (): Array<VNode> | void => {
            if (!tagList.value || tagList.value?.length === 0) {
                return
            }
            let list: Array<VNode> = []
            tagList.value.forEach((val) => {
                // 選項列表
                list.push((
                    <div class='be-select-tag'>
                        <be-tag key={val.label + 'tag'}
                                isClose={true}
                                type='info'
                                size='mini'
                                class='ellipsis'
                                onClose={() => closeTag(val)}>
                            {val.label}
                        </be-tag>
                    </div>
                ))
            })
            return list
        }

        /**
         * 選項列表渲染
         */
        const renderOption = (): Array<VNode> => {
            const keyValue = props?.keyValue || 'id'
            let optionList: Array<VNode> = []
            dataList.value.forEach((val, index) => {
                // 選項列表
                optionList.push((
                    <div
                        class={`
                        ellipsis
                        ${val.type === 'group' && index !== 0 ? 'be-select-option__line' : ''}
                         ${val.isSelect ? 'be-select-option__choice' : ''}
                        ${val.type === 'group' ? 'be-select-option__group' : 'be-select-option'}
                        ${val.disabled ? 'be-select-option__disabled' : ''}`}
                        key={val[keyValue]}
                        onClick={() => {
                            if (val.disabled || val.type === 'group') return
                            handleSelect(val, index)
                        }}>
                        {/*有插槽就渲染插槽*/}
                        {internalInstance.slots.default ? internalInstance.slots.default(val, index) : val[props.labelValue]}
                        {val.isSelect ? <be-icon icon='select' custom-class={`be-select-hook`}></be-icon> : ''}
                    </div>
                ))
            })
            return optionList
        }
        return () => {
            return (
                <div id={`be_select-${uid}`}
                     class='be-select'>
                    <be-popover
                        onUpdate={selectOpenChange}
                        trigger={trigger.value}
                        placement="bottom"
                        ref="beSelectPopover"
                        trigger-elm={`be_select-${uid}`}
                        custom-class="be-select-popover">
                        {{
                            default: (
                                <div style={selectStyle} class='be-select-option-body'>
                                    <div class={`
                                    be-select-option-container 
                                    scrollDiy 
                                    ${loading.value ? 'be-select-loading ' : ''}`}
                                         id={`be_select_option_container_${uid}`}>
                                        {/*渲染loading 或者列表 */}
                                        {loading.value ?
                                            <be-icon icon='loading' spin width='25' height='25'
                                                     fill='#606266'>
                                            </be-icon> : renderOption()}
                                    </div>
                                    {/*动态扩展*/}
                                    {renderExtendElm()}
                                </div>
                            ),
                            trigger: (
                                <div class={`be-select-body ${props.customClass}`}
                                     id={`be-select-body${uid}`}
                                     style={{
                                         cursor: cursor
                                     }}
                                     tabindex={`0`}
                                     onMouseenter={($event) => handleMouseEnter($event)}
                                     onMouseleave={($event) => handleMouseLeave($event)}
                                     onFocus={($event) => handleFocus($event)}
                                     onBlur={($event) => handleBlur($event)}>
                                    {renderTags()}
                                    <input readonly={readonlyInput.value}
                                           tabindex={`-1`}
                                           onFocus={computedPositon}
                                           value={inputMultiple.value}
                                           disabled={props.disabled}
                                           onInput={($event) => inputChange($event)}
                                           style={{
                                               cursor: cursor,
                                               width: txtWidth.value + 'px'
                                           }}
                                           class={`be-select-input be-select-input__${props.size}`}
                                    />
                                    <be-icon icon={iconType.value}
                                             onClick={($event: Event) => {
                                                 if (iconType.value === 'error') {
                                                     handleClear()
                                                     $event.stopPropagation()
                                                 }
                                             }}
                                             class={`be-select-icon`}>
                                    </be-icon>
                                </div>
                            )
                        }}
                    </be-popover>
                </div>
            )
        }
    }
})