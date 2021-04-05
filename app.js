const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const request = require("request");

const server = express();
const dotenv = require("dotenv").config();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Hcm = mongoose.model(
  "HCM",
  new mongoose.Schema({
    employeeId: Number,
    employerId: Number,
    includedAt: Date,
  })
);

const porta = process.env.PORT || 3000;

server.listen(porta, function () {
  console.log(`Servidor funcionando na porta ${porta}.`);
});

server.post("/ponto", (req, res) => {
  let dataHoraAtual = new Date();

  let insert = new Hcm(req.body);
  insert.includedAt = dataHoraAtual;
  insert
    .save()
    .then((item) => {
      enviaDadosHcm(item);
      res.send(
        `<p>Ponto marcado às ${dataHoraAtual.toLocaleTimeString("pt-br")}!</p>
        <script type="text/javascript">
          setTimeout("location.href = '/';", 2000);
        </script>
        `
      );
    })
    .catch((err) => {
      res.status(400).send(
        `<p>Erro ao salvar a marcação do ponto: "${err}"</p>
          <a href="/">Voltar</a>`
      );
    });
});

server.get("/all", (req, res) => {
  let strData = Hcm.find({}, (err, docs) => {
    res.status(200).json(docs);
  });
});

server.use("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

function enviaDadosHcm(item) {
  request.post(
    {
      headers: { "content-type": "application/json" },
      url:
        "https://api.mockytonk.com/proxy/ab2198a3-cafd-49d5-8ace-baac64e72222",
      body: JSON.stringify({
        includedAt: formataData(item.includedAt),
        employeeId: item.employeeId,
        employerId: item.employerId,
      }),
    },
    (error, response, body) => {
      if (error) {
        console.log(error);
      }
      console.log(JSON.parse(body));
    }
  );
}

function formataData(date) {
  let day = ("0" + date.getDate()).slice(-2);
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  return `"${date.getFullYear()}-${month}-${day} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}"`;
}

module.exports = { server };
