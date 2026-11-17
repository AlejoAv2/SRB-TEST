const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "srb.json"), "utf8"));
const partialsDir = path.join(rootDir, "views", "partials");

const partials = {};
fs.readdirSync(partialsDir).forEach((file) => {
  if (file.endsWith(".hbs")) {
    const name = path.basename(file, ".hbs");
    partials[name] = fs.readFileSync(path.join(partialsDir, file), "utf8").trimEnd();
  }
});

function getPropValue(context, propPath, rootContext, index = 0) {
  if (propPath === "@index") return index;
  if (propPath === "this" || propPath === ".") return context;

  const resolve = (obj) =>
    propPath.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);

  let val = resolve(context);
  if (val === undefined && rootContext && context !== rootContext) {
    val = resolve(rootContext);
  }
  return val;
}

function renderHbs(template, context, rootContext, index = 0) {
  let output = template;

  // 1. Expandir partials {{> partialName}}
  let maxDepth = 10;
  while (/\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}/.test(output) && maxDepth > 0) {
    output = output.replace(/\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, pName) => partials[pName] || "");
    maxDepth--;
  }

  // 2. Bloques {{#each ruta}} ... {{/each}}
  const eachRegex = /\{\{#each\s+([a-zA-Z0-9_.]+)\s*\}\}\r?\n?([\s\S]*?)\{\{\/each\}\}\r?\n?/g;
  while (eachRegex.test(output)) {
    output = output.replace(eachRegex, (_, listPath, innerTpl) => {
      const items = getPropValue(context, listPath, rootContext, index);
      if (!Array.isArray(items)) return "";
      return items
        .map((item, idx) => renderHbs(innerTpl, item, rootContext, idx).replace(/[\r\n]+$/, ""))
        .join("\n");
    });
  }

  // 3. Bloques condicionales {{#if cond}} ... {{/if}}
  const ifRegex = /\{\{#if\s+([a-zA-Z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g;
  while (ifRegex.test(output)) {
    output = output.replace(ifRegex, (_, condPath, innerTpl) => {
      const val = getPropValue(context, condPath, rootContext, index);
      return val ? renderHbs(innerTpl, context, rootContext, index) : "";
    });
  }

  // 4. Expresiones sin escape {{{variable}}}
  output = output.replace(/\{\{\{\s*([a-zA-Z0-9_.@]+)\s*\}\}\}/g, (_, key) => {
    const val = getPropValue(context, key, rootContext, index);
    return val !== undefined && val !== null ? String(val) : "";
  });

  // 5. Expresiones estándar {{variable}}
  output = output.replace(/\{\{\s*([a-zA-Z0-9_.@]+)\s*\}\}/g, (_, key) => {
    const val = getPropValue(context, key, rootContext, index);
    return val !== undefined && val !== null ? String(val) : "";
  });

  return output;
}

const homeSource = fs.readFileSync(path.join(rootDir, "views", "home.hbs"), "utf8");
const layoutSource = fs.readFileSync(path.join(rootDir, "views", "layouts", "main.hbs"), "utf8");

const body = renderHbs(homeSource, data, data);
const html = renderHbs(layoutSource, { ...data, body }, { ...data, body });

fs.writeFileSync(path.join(rootDir, "index.html"), html, "utf8");
console.log("Compilación exitosa: views/*.hbs + data/srb.json -> index.html");
