# 使用
- npm i vite-plugin-react-model
- main.js 放在根目录下
- main.js 需要引入<Provider/> , 代码如下
```
import ReactDOM from 'react-dom/client'
import App from "./src/index"
import { Provider } from '@vite-plugin-react-model'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider>
      <App />
    </Provider>
)
```
- 在src目录下创建 app.js ,并抛出 getInitialState 方法，此方法为异步，执行此方法完成以后才会进行render，代码如下
```
const sleep = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(1)
        }, 5000)
    })
}
export const getInitialState = async () => {
    await sleep()
    return {
        c: 1
    }
}
```
- 在src目录下创建models文件夹，后续与umi useModel一致
- 在tsconfig中继承 src/.plugin-model/tsconfig.json



  
