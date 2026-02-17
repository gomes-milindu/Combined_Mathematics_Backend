import axios from "axios";

const sendSMS = async (to, message) => {
  try {

    // normalize number
    if (to.startsWith("+94")) {
      to = "0" + to.slice(3);
    }
    if (to.startsWith("94")) {
      to = "0" + to.slice(2);
    }

    const response = await axios.post(
      "https://quicksend.lk/Client/api.php?FUN=SEND_SINGLE",
      {
        senderID: "QKSendDemo",
        to: to,
        msg: message
      },
      {
        auth: {
          username: process.env.QUICKSEND_EMAIL,
          password: process.env.QUICKSEND_API_KEY
        },
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log("SMS sent:", response.data);

  } catch (error) {
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);
  }
};


export default sendSMS;
