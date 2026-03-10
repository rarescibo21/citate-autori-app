const express = require("express");
const cors = require("cors");
const Joi = require("joi");
const app = express();

app.use(cors());
app.use(express.json());

const JSON_SERVER_URL = "http://localhost:3000/quotes";

// Middleware: Verificam daca ID-ul este numeric
const validateId = (req, res, next) => {
  if (isNaN(req.params.id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  next();
};

// Schema Joi
const quoteSchema = Joi.object({
  author: Joi.string().min(2).required(),
  quote: Joi.string().min(5).required(),
});

// GET quotes
app.get("/api/quotes", async (req, res) => {
  try {
    const response = await fetch(JSON_SERVER_URL);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// POST quote
app.post("/api/quotes", async (req, res) => {

  const { error } = quoteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const response = await fetch(JSON_SERVER_URL);
    const quotes = await response.json();
    
    const newId = quotes.length > 0
      ? Math.max(...quotes.map(q => Number(q.id))) + 1
      : 1;

    const newQuote = { id: newId.toString(), ...req.body };

    const postResponse = await fetch(JSON_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newQuote),
    });

    const data = await postResponse.json();
    res.status(postResponse.status).json(data);

  } catch (error) {
    console.error("Error adding quote:", error);
    res.status(500).json({ error: "Failed to add quote" });
  }
});

// PUT quote
app.put("/api/quotes/:id", validateId, async (req, res) => {

  const { error } = quoteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const quoteId = req.params.id;
    const updatedQuote = { id: quoteId, ...req.body };

    const response = await fetch(`${JSON_SERVER_URL}/${quoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedQuote),
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const data = await response.json();
    const reorderedData = {
      id: data.id,
      author: data.author,
      quote: data.quote
    };

    res.status(response.status).json(reorderedData);

  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
});

// DELETE quote
app.delete("/api/quotes/:id", validateId, async (req, res) => {

  try {
    const quoteId = req.params.id;

    const response = await fetch(`${JSON_SERVER_URL}/${quoteId}`);

    if (!response.ok) {
      return res.status(404).json({ error: "Quote not found" });
    }

    await fetch(`${JSON_SERVER_URL}/${quoteId}`, {
      method: "DELETE"
    });

    res.status(200).json({ message: "Quote deleted successfully" });

  } catch (error) {
    console.error("Error deleting quote:", error);
    res.status(500).json({ error: "Failed to delete quote" });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Server restarted!");
});