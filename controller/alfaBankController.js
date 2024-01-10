const asyncHandler = require("express-async-handler");
const fs = require("fs");
const https = require("https");
const axios = require("axios");

const getKeysAlfa = asyncHandler(async (req, res) => {
  try {
    const code = req.query.code,
      state = req.query.state,
      refresh_token = req.query.refresh_token,
      crtFilePath = "/Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.cer",
      keyFilePath = "/Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.key",
      token = req.query.token,
      passphrase = "Dd202606",
      httpsAgent = new https.Agent({
        cert: fs.readFileSync(crtFilePath),
        key: fs.readFileSync(keyFilePath),
        passphrase: passphrase,
      });

    if (refresh_token) {
      const { data: result } = await axios.post(
        "https://baas.alfabank.ru/api/token",
        `grant_type=authorization_code&refresh_token=${refresh_token}&client_id=71b0076b-f0fa-4142-884a-0cafe5e16992&client_secret=V36!)Lm383tx%.v0w0)T64PC7&redirect_uri=http%3A%2F%2Flocalhost%3A3000&code_verifier=${state}`,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          httpsAgent: httpsAgent,
        }
      );

      return res.json(result);
    } else if (code && state) {
      const { data: result } = await axios.post(
        "https://baas.alfabank.ru/api/token",
        `grant_type=authorization_code&code=${code}&client_id=71b0076b-f0fa-4142-884a-0cafe5e16992&client_secret=V36%21%29Lm383tx%25.v0w0%29T64PC7&redirect_uri=http%3A%2F%2Flocalhost%3A3000&code_verifier=${state}`,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          httpsAgent: httpsAgent,
        }
      );

      return res.json(result);
    } else {
      const { data: result } = await axios.post(
        "https://baas.alfabank.ru/api/revoke",
        `client_id=71b0076b-f0fa-4142-884a-0cafe5e16992&client_secret=V36!)Lm383tx%.v0w0)T64PC7&token=${token}&token_type_hint=refresh_token`,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          httpsAgent: httpsAgent,
        }
      );

      return res.json({ message: "Token was revoked!" });
    }
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
});

const getInfoBank = asyncHandler(async (req, res) => {
  try {
    const code = req.query.code,
      state = req.query.state,
      refresh_token = req.query.refresh_token,
      crtFilePath = "/Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.cer",
      keyFilePath = "/Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.key",
      token = req.query.token,
      passphrase = "Dd202606",
      httpsAgent = new https.Agent({
        cert: fs.readFileSync(crtFilePath),
        key: fs.readFileSync(keyFilePath),
        passphrase: passphrase,
      });

    const result = await axios.get(
      "https://baas.alfabank.ru/api/v1/customer-info",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        httpsAgent: httpsAgent,
      }
    );

    console.log(result.data);

    return res.json(result.data);
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
});

const getPaymentInfo = asyncHandler(async (req, res) => {
  try {
    const number = req.query.accountNumber,
    crtFilePath = "/Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.cer",
    keyFilePath = "/Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.key",
      token = req.query.token,
      passphrase = "Dd202606",
      httpsAgent = new https.Agent({
        cert: fs.readFileSync(crtFilePath),
        key: fs.readFileSync(keyFilePath),
        passphrase: passphrase,
      });

    const result = await axios.get(
      `https://baas.alfabank.ru/api/statement/transactions?accountNumber=${number}&statementDate=2021-10-07&page=2&curFormat=curTransfer`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        httpsAgent: httpsAgent,
      }
    );

    console.log(result.data);

    return res.json(result.data);
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
});

const getSummeryInfo = asyncHandler(async (req, res) => {
  try {
    const number = req.query.accountNumber,
    crtFilePath = "/Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.cer",
    keyFilePath = "/Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.key",
      token = req.query.token,
      passphrase = "Dd202606",
      httpsAgent = new https.Agent({
        cert: fs.readFileSync(crtFilePath),
        key: fs.readFileSync(keyFilePath),
        passphrase: passphrase,
      });

    const result = await axios.get(
      `https://baas.alfabank.ru/api/statement/summary?accountNumber=${number}&statementDate=2022-01-13`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        httpsAgent: httpsAgent,
      }
    );

    console.log(result.data);

    return res.json(result.data);
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
});

module.exports = {
  getKeysAlfa,
  getInfoBank,
  getPaymentInfo,
  getSummeryInfo,
};


// openssl pkcs12 -export -out MeMetrics_2023_1.pfx -inkey /Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.key -in /Users/daniil/Desktop/MeMetricsCer/MeMetrics_2023.cer -certfile /Users/daniil/Downloads/test_cert/root_apica_2022.cer -certfile /Users/daniil/Downloads/test_cert/sub_root_apica_2022.cer