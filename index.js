const bodyParser = require("body-parser");
require("dotenv").config();
const express = require("express");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const authRoutes = require("./routes/authRoutes.js");
const pool = require("./db.js");
const app = express();

app.set("view engine", "ejs");

//static
app.use(express.static("style"));
app.use("./css", express.static(__dirname + "style/css"));
app.use("./asset", express.static(__dirname + "style/asset"));
app.use("./js", express.static(__dirname + "style/js"));

app.use(bodyParser.json());

app.use("/v1", authRoutes);

app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.get("/form", (req, res) => {
  res.render("form.ejs");
});
app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.post("/checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "FaceSearch Ai Plan",
          },
          unit_amount: 50 * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    shipping_address_collection: {
      allowed_countries: ["US", "BR"],
    },
    success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/cancel`,
  });

  res.redirect(session.url);
});

app.get("/complete", async (req, res) => {
  const result = Promise.all([
    stripe.checkout.sessions.retrieve(req.query.session_id, {
      expand: ["payment_intent.payment_method"],
    }),
    stripe.checkout.sessions.listLineItems(req.query.session_id),
  ]);

  console.log(JSON.stringify(await result));

  res.send("Your payment was successful");
  res.redirect("/");
});

app.get("/cancel", (req, res) => {
  res.redirect("/");
});

app.listen(3000, () => console.log("Server started on port 3000"));
