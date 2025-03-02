import { error } from "console";
import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: "recipe" | "ingredient";
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook = new Map<string, cookbookEntry>();

// Task 1 helper (don't touch)
app.post("/parse", (req: Request, res: Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input);
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  }
  res.json({ msg: parsed_string });
  return;
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that
const parse_handwriting = (recipeName: string): string | null => {
  let cleaned = "";
  let haveSpace = false;

  // Clean up the string
  for (let i = 0; i < recipeName.length; i++) {
    const ch = recipeName[i];
    if (ch === "-" || ch === "_") {
      if (!haveSpace) {
        cleaned += " ";
        haveSpace = true;
      }
    } else if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")) {
      cleaned += ch;
      haveSpace = false;
    } else if (ch == " ") {
      if (!haveSpace) {
        cleaned += " ";
        haveSpace = true;
      }
    }
  }
  cleaned = cleaned.trim();

  // If the string is empty, return null
  if (cleaned.length === 0) {
    return null;
  }

  // Capitalize the first letter of each word and lowercase the rest
  const words = cleaned.split(" ");
  const capitalized = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  return capitalized.join(" ");
};

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req: Request, res: Response) => {
  const entry = req.body;

  // Error checking
  if (entry.type !== "recipe" && entry.type !== "ingredient") {
    return res.status(400).send({ error: "Invalid type" });
  }
  if (cookbook.has(entry.name)) {
    return res.status(400).send({ error: "Entry already exists" });
  }
  if (entry.type === "ingredient") {
    if (typeof entry.cookTime !== "number" || entry.cookTime < 0) {
      return res.status(400).send({ error: "Invalid cookTime" });
    }
  } else if (entry.type === "recipe") {
    const itemsSet = new Set<string>();
    for (const item of entry.requiredItems) {
      if (itemsSet.has(item.name)) {
        return res.status(400).send({ error: "Duplicate item" });
      }
      itemsSet.add(item.name);
    }
  }

  // Add the entry to the cookbook
  cookbook.set(entry.name, entry);
  res.status(200).send();
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req: Request, res: Response) => {
  const name = req.query.name as string;

  // Error checking
  if (!cookbook.has(name)) {
    return res.status(400).send({ error: "Recipe not found" });
  }
  if (cookbook.get(name).type !== "recipe") {
    return res.status(400).send({ error: "Not a recipe" });
  }

  try {
    const summary = getSummary(name);
    return res.status(200).send(summary);
  } catch (error: any) {
    return res.status(400).send({ error: error.message });
  }
});

function getSummary(name: string) {
  // Error checking
  if (!cookbook.has(name)) {
    throw new Error("Recipe not found");
  }
  if (cookbook.get(name).type !== "recipe") {
    throw new Error("Not a recipe");
  }

  let cookTime = 0;
  const ingredientMap = new Map<string, number>();
  const entry = cookbook.get(name) as recipe;
  for (const item of entry.requiredItems) {
    const requiredEntry = cookbook.get(item.name);
    if (!requiredEntry) {
      throw new Error("Missing ingredient");
    }

    if (requiredEntry.type === "ingredient") {
      cookTime += (requiredEntry as ingredient).cookTime * item.quantity;
      ingredientMap.set(
        item.name,
        (ingredientMap.get(item.name) ?? 0) + item.quantity
      );
    } else if (requiredEntry.type === "recipe") {
      const subSummary = getSummary(item.name);
      cookTime += subSummary.cookTime * item.quantity;
      for (const subItem of subSummary.ingredients) {
        ingredientMap.set(
          subItem.name,
          (ingredientMap.get(subItem.name) ?? 0) +
            subItem.quantity * item.quantity
        );
      }
    }
  }
  const ingredients = Array.from(ingredientMap.entries()).map(
    ([name, quantity]) => ({ name, quantity })
  );
  return { name, cookTime, ingredients };
}

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
