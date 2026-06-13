import express from "express";
import { supabase } from "./supabase.js";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());

app.use(express.json());

app.get("/", async (req, res) => {
  const data = await supabase.from("transactions").select("*");
  console.log(data);
  res.send(data);
});

app.post("/data", async (req, res, next) => {
  // console.log(req.url, req.method);
  console.log(req.body);

  try {
    const { error } = await supabase.from("books").insert([
      {
        title: req.body.title,
        author: req.body.author,
        subject: req.body.subject,
        academicclass: req.body.academicclass,
        edition: req.body.edition,
        publisher: req.body.publisher,
        description: req.body.description,
        donor_id: req.body.donor_id,
        book_img_url: req.body.book_img_url,
      },
    ]);

    if (error) {
      res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({ success: true, message: null });
  } catch (err) {
    next(err);
  }
});

app.get("/getAllBooks", async (req, res) => {
  const { data, error } = await supabase.from("books").select("*");
  //   console.log(data);
  res.json(data);
});

app.post("/insertUser", async (req, res) => {
  console.log(req.body);
  const { data, error } = await supabase.from("users").insert([
    {
      id: req.body.id,
      email: req.body.email,
      name: req.body.name,
    },
  ]);

  if (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  } else {
    res.status(201).json({ success: true, message: "created user" });
  }
});

app.post("/insertTransaction", async (req, res) => {
  console.log(req.body);

  const { data, error } = await supabase.from("transactions").insert(req.body);
  if (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  } else {
    res.status(201).json({ success: true, message: "request sent" });
  }
});

app.post("/fetchReqBooks", async (req, res) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("receiver_id", req.body.id);
  console.log(data);

  if (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  } else {
    res.status(200).json({ success: true, data: data });
  }
});

app.post("/declineReq", async (req, res) => {
  const { data, error } = await supabase
    .from("transactions")
    .update({
      status: "declined",
      donor_email: req.body.email,
    })
    .eq("receiver_id", req.body.receiver_id)
    .eq("id", req.body.id);
  if (error) {
    res.status(400).json({ success: false, message: error.message });
  } else {
    res.status(200).json({ success: true, message: "successfully declined" });
  }
});

app.post("/acceptReq", async (req, res) => {
  const { data, error } = await supabase
    .from("transactions")
    .update({
      status: "accepted",
      donor_email: req.body.email,
    })
    .eq("receiver_id", req.body.receiver_id)
    .eq("id", req.body.id);

  if (error) {
    res.status(400).json({ success: false, message: error.message });
  } else {
    res.status(200).json({ success: true, message: "successfully accepted" });
  }
});

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
