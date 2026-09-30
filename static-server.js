const express = require("express");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.static(__dirname));
app.listen(port, () => console.log(`Portfolio running at http://localhost:${port}`));