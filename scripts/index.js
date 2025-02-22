const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const sourceDir = "./examples/sites/demos/apis";
const outputFilePath = path.join(__dirname, "web-types.json");
const tagsOutputFilePath = path.join(__dirname, "vetur-tags.json");
const AttributesOutputFilePath = path.join(__dirname, "vetur-attributes.json");

// 读取目录中的所有 .js 文件
function readFiles(dir) {
  const files = fs.readdirSync(dir);
  return files.filter((file) => file.endsWith(".js")).map((file) => path.join(dir, file));
}

// 从 AST 中提取 export default 对象，并返回 apis 数组中的数据
function extractDataFromFiles(files) {
  const components = [];
  files.forEach((file) => {
    const fileContent = fs.readFileSync(file, "utf-8");
    const ast = parser.parse(fileContent, {
      sourceType: "module",
      plugins: ["jsx"]
    });
    traverse(ast, {
      ExportDefaultDeclaration({ node }) {
        if (node.declaration.type === "ObjectExpression") {
          // 将 export default 的对象属性转换为一个 map
          const topProps = Object.fromEntries(node.declaration.properties.map((prop) => [prop.key.name, prop.value]));
          // 如果存在 apis 属性，则解析其中的每个组件
          if (topProps.apis && topProps.apis.type === "ArrayExpression") {
            topProps.apis.elements.forEach((componentNode) => {
              if (componentNode.type === "ObjectExpression") {
                const componentData = extractComponentData(componentNode);
                components.push(componentData);
              }
            });
          }
        }
      }
    });
  });
  return components;
}

function toPascalCase(str) {
  return str
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) // 处理短横线后的字母大写
    .replace(/^([a-z])/, (_, letter) => letter.toUpperCase()); // 处理首字母大写
}

// 辅助函数：将 ObjectExpression 转换为一个简单对象（仅处理字面量和数组/对象嵌套情况）
function objectExpressionToObject(node) {
  if (node.type === "StringLiteral" || node.type === "NumericLiteral" || node.type === "BooleanLiteral") {
    return node.value;
  }
  if (node.type === "ArrayExpression") {
    return node.elements.map(objectExpressionToObject);
  }
  if (node.type === "ObjectExpression") {
    return Object.fromEntries(node.properties.map((prop) => [prop.key.name, objectExpressionToObject(prop.value)]));
  }
  return undefined;
}

// 提取组件数据：从每个组件的 ObjectExpression 中提取 name、props、events、slots、methods 等信息
function extractComponentData(componentNode) {
  const propsMap = Object.fromEntries(componentNode.properties.map((prop) => [prop.key.name, prop.value]));
  const componentData = {
    name: propsMap.name ? objectExpressionToObject(propsMap.name) : "Unnamed Component",
    // 如果没有 description，可以自定义，比如取 type 或者其他信息
    description: propsMap.description ? objectExpressionToObject(propsMap.description) : "",
    attributes: extractAttributes(propsMap.props),
    events: extractEvents(propsMap.events),
    slots: extractSlots(propsMap.slots),
    methods: extractMethods(propsMap.methods)
  };
  return componentData;
}

// 从 props 节点提取属性数组
function extractAttributes(propsNode) {
  if (!propsNode || propsNode.type !== "ArrayExpression") return [];
  return propsNode.elements.map((prop) => {
    const propMap = Object.fromEntries(prop.properties.map((p) => [p.key.name, p.value]));
    return {
      name: propMap.name ? objectExpressionToObject(propMap.name) : "unknown",
      type: propMap.type ? objectExpressionToObject(propMap.type) : "unknown",
      defaultValue: propMap.defaultValue ? objectExpressionToObject(propMap.defaultValue) : "",
      // 从 desc 对象中获取 en-US 文案

      description:
        propMap.desc && propMap.desc.type === "ObjectExpression"
          ? propMap.desc.properties.find((d) => d.key.value === "zh-CN")
            ? objectExpressionToObject(propMap.desc.properties.find((d) => d.key.value === "zh-CN").value)
            : ""
          : ""
    };
  });
}

// 从 events 节点提取事件数组
function extractEvents(eventsNode) {
  if (!eventsNode || eventsNode.type !== "ArrayExpression") return [];
  return eventsNode.elements.map((event) => {
    const eventMap = Object.fromEntries(event.properties.map((p) => [p.key.name, p.value]));
    return {
      name: eventMap.name ? objectExpressionToObject(eventMap.name) : "unknown",
      type: eventMap.type ? objectExpressionToObject(eventMap.type) : "",
      description:
        eventMap.desc && eventMap.desc.type === "ObjectExpression"
          ? eventMap.desc.properties.find((d) => d.key.value === "zh-CN")
            ? objectExpressionToObject(eventMap.desc.properties.find((d) => d.key.value === "zh-CN").value)
            : ""
          : ""
    };
  });
}

// 从 slots 节点提取插槽数组
function extractSlots(slotsNode) {
  if (!slotsNode || slotsNode.type !== "ArrayExpression") return [];
  return slotsNode.elements.map((slot) => {
    const slotMap = Object.fromEntries(slot.properties.map((p) => [p.key.name, p.value]));
    return {
      name: slotMap.name ? objectExpressionToObject(slotMap.name) : "unknown",
      description:
        slotMap.desc && slotMap.desc.type === "ObjectExpression"
          ? slotMap.desc.properties.find((d) => d.key.value === "zh-CN")
            ? objectExpressionToObject(slotMap.desc.properties.find((d) => d.key.value === "zh-CN").value)
            : ""
          : ""
    };
  });
}

// 提取方法（若存在）
function extractMethods(methodsNode) {
  if (!methodsNode || methodsNode.type !== "ArrayExpression") return [];
  // 此处处理较简单，如果方法内容较复杂可进一步扩展
  return methodsNode.elements.map((method) => {
    // 假设 method 为对象，提取 name 属性
    const methodMap = Object.fromEntries(method.properties.map((p) => [p.key.name, p.value]));
    return {
      name: methodMap.name ? objectExpressionToObject(methodMap.name) : "unknown",
      description: methodMap.description ? objectExpressionToObject(methodMap.description) : ""
    };
  });
}

// 生成 web-types.json 数据
function generateWebTypesJson(components) {
  return {
    "$schema": "https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json",
    "framework": "vue",
    "name": "tiny-vue",
    "version": "2.44.7",
    "js-types-syntax": "typescript",
    "description-markup": "markdown",
    contributions: {
      html: {
        "tags": components.map((component) => ({
          name: `tiny-${component.name}`,
          source: {
            symbol: `Tiny${toPascalCase(component.name)}`
          },
          description: component.description,
          "doc-url": `https://opentiny.design/tiny-vue/zh-CN/os-theme/components/${component.name}`,
          attributes: component.attributes.map((item) => {
            return {
              name: item.name,
              description: item.description,
              type: [item.type],
              default: item.defaultValue,
              "doc-url": `https://opentiny.design/tiny-vue/zh-CN/os-theme/components/action-menu#api`
            };
          }),
          events: component.events.map((item) => {
            return {
              name: item.name,
              description: item.description,
              "doc-url": `https://opentiny.design/tiny-vue/zh-CN/os-theme/components/action-menu#api`
            };
          }),
          methods: component.methods.map((item) => {
            return {
              ...item,
              "doc-url": `https://opentiny.design/tiny-vue/zh-CN/os-theme/components/action-menu#api`
            };
          }),
          slots: component.slots.map((item) => {
            return {
              ...item,
              "doc-url": `https://opentiny.design/tiny-vue/zh-CN/os-theme/components/action-menu#api`
            };
          })
        }))
      }
    }
  };
}

function generateComponentTags(components) {
  let tagsObj = {};

  components.forEach((component) => {
    tagsObj[`tiny-${component.name}`] = {
      "attributes": component.attributes.map((item) => item.name)
    };
  });
  return tagsObj;
}

function generateComponentAttributes(components) {
  let attributesObj = {};

  components.forEach((component) => {
    component.attributes.forEach((item) => {
      console.log(item);
      attributesObj[`tiny-${component.name}/${item.name}`] = {
        description: item.description,
        type: item.type
      };
    });
  });

  return attributesObj;
}

// 写入 web-types.json 文件
function writeWebTypesJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// 执行流程
const files = readFiles(sourceDir);
const extractedComponents = extractDataFromFiles(files);
const webTypesJson = generateWebTypesJson(extractedComponents);
const tagsJson = generateComponentTags(extractedComponents);
const attributesJson = generateComponentAttributes(extractedComponents);

writeWebTypesJson(outputFilePath, webTypesJson);
writeWebTypesJson(tagsOutputFilePath, tagsJson);
writeWebTypesJson(AttributesOutputFilePath, attributesJson);

console.log("web-types.json has been generated successfully.");
