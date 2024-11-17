import inquirer from "inquirer";
import chalk from "chalk";
import { writeFile, readdir, mkdir } from "fs/promises";

type Language = "Chinese" | "English";
const lang = (lang: Language) => {
  switch (lang) {
    case "Chinese":
      return `\\documentclass[a4paper,12pt]{ctexart}
\\setCJKmainfont{楷体-简}`;
    case "English":
      return "\\documentclass[a4paper,12pt]{article}";
  }
};

const chineseVSCodeConfig = {
  "latex-workshop.latex.recipes": [
    {
      name: "xelatex 🔃",
      tools: ["xelatex"],
    },
    {
      name: "pdflatex 🔃",
      tools: ["pdflatex"],
    },
    {
      name: "latexmk 🔃",
      tools: ["latexmk"],
    },
    {
      name: "xelatex ➞ bibtex ➞ xelatex`×2",
      tools: ["xelatex", "bibtex", "xelatex", "xelatex"],
    },
    {
      name: "pdflatex ➞ bibtex ➞ pdflatex`×2",
      tools: ["pdflatex", "bibtex", "pdflatex", "pdflatex"],
    },
  ],
  // 具体的编译命令配置
  "latex-workshop.latex.tools": [
    {
      name: "latexmk",
      command: "latexmk",
      args: [
        "-synctex=1",
        "-interaction=nonstopmode",
        "-file-line-error",
        "-pdf",
        "-outdir=%OUTDIR%",
        "%DOC%",
      ],
    },
    {
      name: "xelatex",
      command: "xelatex",
      args: [
        "-synctex=1",
        "-interaction=nonstopmode",
        "-file-line-error",
        "%DOC%",
      ],
    },
    {
      name: "pdflatex",
      command: "pdflatex",
      args: [
        "-synctex=1",
        "-interaction=nonstopmode",
        "-file-line-error",
        "%DOC%",
      ],
    },
    {
      name: "bibtex",
      command: "bibtex",
      args: ["%DOCFILE%"],
    },
  ],
};
const basePackages = `\\usepackage[a4paper, total={3in, 9in}, textwidth=16cm,bottom=1in,top=1.4in]{geometry}
\\usepackage{setspace}
\\usepackage{sectsty}
\\usepackage{graphicx}
\\usepackage[dvipsnames,table]{xcolor}
\\usepackage{soul}
\\usepackage{float}
\\usepackage{outlines}
\\usepackage{caption}
\\usepackage{subcaption}
\\usepackage{enumitem}
\\usepackage{setspace}`;

const mathPackages = `\\usepackage{amsmath}
\\usepackage{amsthm}
\\usepackage{amssymb}
\\usepackage{esvect}
\\usepackage{esdiff}
\\usepackage{mathtools}
\\usepackage{siunitx}`;

const baseConfig = `\\usepackage{hyperref}
\\hypersetup{
  colorlinks=true,
  linkcolor=blue,
  urlcolor=Magenta!90!black,
}
\\usepackage[noabbrev,capitalise,nameinlink]{cleveref}
\\newcommand{\\lb}{\\\\[8pt]}`;

const tikz = `\\usepackage{tikz,pgfplots}
\\usetikzlibrary{positioning,decorations.markings,calc,shapes.misc}
`;

const paren = `\\newcommand{\\vect}[3]{\\begin{bmatrix}#1\\\\#2\\\\#3 \\end{bmatrix}}
\\newcommand{\\angled}[1]{\\langle{#1}\\rangle}
\\newcommand{\\paren}[1]{\\left(#1\\right)}
\\newcommand{\\sqb}[1]{\\left[#1\\right]}
\\newcommand{\\coord}[3]{\\angled{#1,\\, #2,\\, #3}}
\\newcommand{\\pair}[2]{\\paren{#1,\\, #2}}
\\DeclarePairedDelimiter{\\ceil}{\\lceil}{\\rceil}
\\DeclarePairedDelimiter{\\abs}{\\left|}{\\right|}
`;

const mathContentBlocks = `\\newtheorem{lemma}{Lemma}
\\newtheorem{proposition}{Proposition}
\\newtheorem{remark}{Remark}
\\newtheorem{observation}{Observation}
\\newtheorem{definition}{Definition}
\\crefname{lemma}{Lemma}{Lemmas}
\\crefname{proposition}{Proposition}{Propositions}
\\crefname{remark}{Remark}{Remarks}
\\crefname{observation}{Observation}{Observations}
\\crefname{definition}{Definition}{Definition}`;

const watermark = `\\usepackage{draftwatermark}
\\SetWatermarkText{timthedev07 | 2025}
\\SetWatermarkScale{3}
\\SetWatermarkColor[gray]{0.97}`;

const imgCommand = `\\newcommand{\\img}[4]{\\begin{center}
  \\begin{figure}[H]
    \\centering
    \\includegraphics[width=#2\\textwidth]{#1}
    \\caption{#3}
    \\label{fig:#4}
  \\end{figure}
\\end{center}}`;

const docStart = (title: string, author: string) => `\\begin{document}
\\pagenumbering{arabic}
\\begin{titlepage}
  \\begin{center}
    \\vspace*{8cm}
    {\\Large {${title}}} \\\\
    \\vspace*{1.2cm}
    \\large{By ${author}}
  \\end{center}
\\end{titlepage}

\\pagebreak
\\tableofcontents
\\pagebreak

\\clearpage
\\setcounter{page}{1}
\\addtocontents{toc}{\\protect\\thispagestyle{empty}}
\\pagebreak`;

const sectionalPageBreakStr = `\\let\\oldsection\\section
\\renewcommand\\section{\\clearpage\\oldsection}
`;

const doubleSpacingStr = `\\doublespacing
`;

const colorBoxes = `
\\usepackage[most]{tcolorbox}
\\newtcolorbox[auto counter]{rem}[1][]{fonttitle=\\bfseries, title=\\strut Remark.~\\thetcbcounter,colback=purple!5!white,colframe=purple!65!gray,top=5mm,bottom=5mm}
\\newtcolorbox[auto counter]{defin}[1][]{fonttitle=\\bfseries, title=\\strut Definition.~\\thetcbcounter,colback=black!5!white,colframe=black!65!gray,top=5mm,bottom=5mm}
\\newtcolorbox[auto counter]{obs}[1][]{fonttitle=\\bfseries, title=\\strut Observation.~\\thetcbcounter,colback=RedViolet!5!white,colframe=RedViolet!65!gray,top=5mm,bottom=5mm}
\\newtcolorbox[auto counter]{lem}[1][]{fonttitle=\\bfseries, title=\\strut Lemma.~\\thetcbcounter,colback=Maroon!5!white,colframe=Maroon!65!gray,top=5mm,bottom=5mm}
\\newtcolorbox[auto counter]{prop}[1][]{fonttitle=\\bfseries, title=\\strut Proposition.~\\thetcbcounter,colback=RedOrange!5!white,colframe=RedOrange!65!gray,top=5mm,bottom=5mm}
`;

const gatherUsepackage = (docWithPreamble: string) => {
  const lines = docWithPreamble.trim().split("\n");
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("\\usepackage")) {
      start = i;
      break;
    }
  }
  const usepackageLines = lines
    .slice(start)
    .filter((line) => line.includes("\\usepackage"));
  const withoutUsepackage = lines
    .slice(start)
    .filter((line) => !line.includes("\\usepackage"));
  return `${lines.slice(0, start).join("\n")}
${usepackageLines.join("\n")}
${withoutUsepackage.join("\n")}`;
};

(async () => {
  const response = await inquirer.prompt<{
    language: Language;
    hasImages: boolean;
    title: string;
    author: string;
    usesTikz: boolean;
    usesColorBoxes: boolean;
    usesBracketShorthand: boolean;
    isMath: boolean;
    noIndent: boolean;
    hasWatermark: boolean;
    filename: string;
    sectionalPageBreak: boolean;
    doubleSpacing: boolean;
  }>([
    {
      type: "input",
      name: "filename",
      message: "Filename of the document (without extension):",
      required: true,
    },
    {
      type: "list",
      name: "language",
      choices: ["Chinese", "English"],
      message: "Language of the document: ",
    },
    {
      type: "confirm",
      name: "hasImages",
      message: "Does the document contain images?",
    },
    {
      type: "input",
      name: "title",
      message: "Title of the document:",
      required: true,
      validate: (input) => {
        if (input.trim() === "") {
          return "Title cannot be empty";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "author",
      message: "Author of the document",
      default: "timthedev07",
    },
    {
      type: "confirm",
      message: "Is the document math-oriented?",
      default: true,
      name: "isMath",
    },
    {
      type: "confirm",
      name: "usesTikz",
      message: "Does the document use TikZ?",
      default: false,
    },
    {
      type: "confirm",
      name: "usesColorBoxes",
      message: "Does the document use color boxes (e.g. lemma, theorem)?",
      default: false,
    },
    {
      type: "confirm",
      name: "usesBracketShorthand",
      message: "Does the document use bracket shorthand commands?",
      default: false,
    },
    {
      type: "confirm",
      name: "noIndent",
      message: "Disable paragraph indentation?",
      default: false,
    },
    {
      type: "confirm",
      name: "hasWatermark",
      message: "Does the document have a watermark?",
      default: false,
    },
    {
      type: "confirm",
      name: "sectionalPageBreak",
      message: "Breaks the page after each section?",
      default: true,
    },
    {
      type: "confirm",
      name: "doubleSpacing",
      message: "Double spacing?",
      default: true,
    },
  ]);

  const {
    language,
    isMath,
    author,
    hasImages,
    title,
    usesBracketShorthand,
    usesColorBoxes,
    usesTikz,
    noIndent,
    hasWatermark,
    filename,
    sectionalPageBreak,
    doubleSpacing,
  } = response;

  let document = `${lang(language)}
${basePackages}
`;
  if (isMath) {
    document += mathPackages + "\n" + mathContentBlocks + "\n";
  }
  document += baseConfig + "\n";
  if (usesTikz || usesColorBoxes) {
    document += tikz + "\n";
  }
  if (hasWatermark) {
    document += watermark + "\n";
  }
  if (usesBracketShorthand) {
    document += paren + "\n";
  }
  if (noIndent) {
    document += "\\parindent=0pt\n";
  }
  if (hasImages) {
    document += imgCommand + "\n";
  }
  if (usesColorBoxes) {
    document += colorBoxes + "\n";
  }
  if (sectionalPageBreak) {
    document += sectionalPageBreakStr + "\n";
  }
  if (doubleSpacing) {
    document += doubleSpacingStr + "\n";
  }

  console.log(chalk.magenta("\n\n----------------\n\n"));

  document = gatherUsepackage(document) + "\n";

  document += docStart(title, author) + "\n\n" + "\\end{document}" + "\n";

  try {
    await writeFile(`./${filename}.tex`, document);
    console.log(chalk.green("File created successfully!"));
  } catch (e) {
    console.log(e);
  }

  if (language !== "Chinese") {
    return;
  }

  console.log(chalk.cyan("Creating VSCode config for ctex..."));

  const d = await readdir("./");
  const hasVscodeFolder = d.includes(".vscode");
  if (!hasVscodeFolder) {
    await mkdir("./.vscode");
    await writeFile(
      "./.vscode/settings.json",
      JSON.stringify(chineseVSCodeConfig)
    );
    console.log(chalk.green("VSCode config created."));
  } else {
    if (d.includes("./.vscode/settings.json")) {
      const existingConfig = require("./.vscode/settings.json");
      existingConfig["latex-workshop.latex.recipes"] = [
        ...existingConfig["latex-workshop.latex.recipes"],
        ...chineseVSCodeConfig["latex-workshop.latex.recipes"],
      ];
      existingConfig["latex-workshop.latex.tools"] = [
        ...existingConfig["latex-workshop.latex.tools"],
        ...chineseVSCodeConfig["latex-workshop.latex.tools"],
      ];
      await writeFile(
        "./.vscode/settings.json",
        JSON.stringify(existingConfig)
      );
    } else {
      await writeFile(
        "./.vscode/settings.json",
        JSON.stringify(chineseVSCodeConfig)
      );
      console.log(chalk.green("VSCode config updated."));
    }
  }
})();
