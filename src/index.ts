import fs from "fs"
import path from "path"
import { createModel } from "./createmodel"

export const cwdPath = process.cwd()
export const modelsPath = path.resolve(cwdPath, './src/models')
export const hasModel = fs.existsSync(modelsPath)

export default () => {
    return {
        name: 'vite-plugin-react-model',
        config: (config) => {
            config.resolve.alias["@vite-plugin-react-model"] = path.resolve(cwdPath, "./src/.plugin-model")
            config.resolve.alias["@/*"] = path.resolve(cwdPath, "./src/*")
            createModel()
        }
    }
}