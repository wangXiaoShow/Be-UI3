import paginationComponents from './src/pagination';
import {App} from 'vue'
import type {SFCWithInstall} from '../../utils/types'

paginationComponents.install = (app: App): void => {
    app.component(paginationComponents.name, paginationComponents)
}
const BePagination = paginationComponents as SFCWithInstall<typeof paginationComponents>
export default BePagination