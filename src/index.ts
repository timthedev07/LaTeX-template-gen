import inquirer from "inquirer";

type Language = "Chinese" | "English";

(async () => {
  const response = await inquirer.prompt<{
    language: Language;
    hasImages: boolean;
  }>([
    {
      type: "list",
      name: "language",
      choices: ["Chinese", "English"],
      message: "Language of the document: ",
    },
    {
      type: "checkbox",
      name: "hasImages",
      message: "Does the document contain images? ",
    },
  ]);
  response.hasImages;
})();
