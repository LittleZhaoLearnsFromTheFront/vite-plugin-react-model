import path from "path"
import fs from "fs"
import { cwdPath, hasModel, modelsPath } from "."
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const createModel = () => {

    const files = hasModel ? fs.readdirSync(modelsPath) : []
    const formatFiles = files.map((t, i) => ({
        model: 'model_' + (i + 1),
        path: "\"" + modelsPath + "/" + t + "\"",
        namespace: '\"' + t.split('.')[0] + '\"'
    }))
    const arr = [...formatFiles, {
        model: 'model_' + (formatFiles.length + 1),
        path: "\"" + path.resolve(cwdPath, './src/.plugin-model/@@initialState') + "\"",
        namespace: '\"' + '@@initialState' + '\"'
    }]
    const template = `// @ts-nocheck
${arr.map((t) => ('import ' + t.model + " from " + t.path + "\n")).join('')}
    
export const models = {
    ${arr.map((t) => t.model + ':' + '{ namespace:' + t.namespace + ',model:' + t.model + '},\n\t').join("")}
} as const
`
    if (!template) return
    const pluginModelPath = path.resolve(cwdPath, "./src/.plugin-model")
    const hasPluginModel = fs.existsSync(pluginModelPath)

    if (!hasPluginModel) {
        fs.mkdirSync(pluginModelPath)
    }

    const srcPluginModelPath = path.resolve(pluginModelPath, "./model.ts")
    const srcPluginIndexPath = path.resolve(pluginModelPath, "./index.ts")
    const srcPluginTsconfigPath = path.resolve(pluginModelPath, "./tsconfig.json")

    fs.writeFileSync(srcPluginModelPath, template)
    fs.cpSync(path.resolve(__dirname, '../src/@@initialState.ts'), path.resolve(pluginModelPath, "./@@initialState.ts"))
    fs.cpSync(path.resolve(__dirname, '../src/model.tsx'), path.resolve(pluginModelPath, "./useModel.tsx"))
    fs.cpSync(path.resolve(__dirname, '../src/provider.tsx'), path.resolve(pluginModelPath, "./provider.tsx"))
    fs.writeFileSync(srcPluginIndexPath, `// @ts-nocheck
export * from "./useModel"
export * from "./provider"
`)
    fs.writeFileSync(srcPluginTsconfigPath, `{
    "compilerOptions": {
        "paths": {
            "@/*": [
              "../../src/*"
            ],
            "@vite-plugin-react-model": [
              "../../src/.plugin-model"
            ]
        }
    }
}`)

}