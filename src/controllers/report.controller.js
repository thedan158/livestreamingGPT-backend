import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json" assert { type: "json" }
import { Configuration, OpenAIApi } from "openai";
import crypto from "crypto"



console.log(process.env.API_KEY)
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.API_KEY,
    organization: process.env.ORGANIZATION_KEY
  })
)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  admin.app();
}
const db = admin.firestore();
function GenerateUASignature(appId, signatureNonce, serverSecret, timeStamp) {
  const hash = crypto.createHash('md5'); //Use the MD5 hashing algorithm.
  var str = appId + signatureNonce + serverSecret + timeStamp;
  hash.update(str);
  //hash.digest('hex') indicates that the output is in hex format 
  return hash.digest('hex');
}

export const ReportController = {
  savePreset: async (req, res) => {
    try {
      const data = req.body
      if (!data)
        return res.status(201).json({
          success: false,
          message: "Data not found",
        });
      if (!data.roomID)
        return res.status(201).json({
          success: false,
          message: "Livestream not found",
        });
      const preset = [
        { role: "user", content: `you are an assistant of a sale livestreaming person. His/her name is ${data.legalname}, he/she is ${data.age} and he/she is a ${data.nationality}, ${data.info}. Can you remember this and tell back when asked ?` },
        { role: "assistant", content: "Yes, I can" },
        { role: "user", content: `alright very nice ! today he will be selling : ${data.products}. Can you remember this list and answer when asked ?` },
        { role: "assistant", content: "Yes, I can remember the list of products" },
      ]
      console.log(preset)
      await db.collection('Presets').doc(data.roomID).set({
        roomID: data.roomID,
        preset: preset
      })
      return res.status(200).json({
        success: true,
        message: "Preset saved"
      });
    } catch (error) {
      return res.status(501).json({
        success: false,
        message: error,
      });
    }
  },
  requestAI: async (req, res) => {
    try {
      const data = req.body
      console.log('request ai', data)
      if (!data)
        return res.status(201).json({
          success: false,
          message: "Data not found",
        });
      if (!data.message)
        return res.status(201).json({
          success: false,
          message: "Message not found",
        });
      const chat = await db.collection('Chats').doc(data.roomID + '_' + data.fromUser.userName).get();
      const chatData = chat.data()
      console.log('chatData history', chatData)
      if (chatData) {
        await db.collection('Chats').doc(data.roomID + '_' + data.fromUser.userName).set({
          ...data, history: []
        })
      } else {
        await db.collection('Chats').doc(data.roomID + '_' + data.fromUser.userName).set(
          { ...data, response: "", history: [] },
          { merge: true }
        )
      }
      console.log('chatData history', chat.data())
      const preset = await db.collection("Presets").doc(data.roomID).get();
      const msgPreset = preset.data().preset

      let messages = [
        {
          role: "system",
          content: "You are LivestreamGPT, an AI to help sale-livestreamer communicate with their customer"
        },
        ...msgPreset
      ];

      if (chatData && chatData.history) {
        messages = messages.concat(chatData.history);
      }
      messages.push({ role: "user", content: data.message });

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages
      })
      if (!response) {
        return res.status(201).json({
          success: false,
          message: "Cant get data from openai",
        });
      }
      console.log('response', response.data.choices[0].message)
      let newChatdata = chatData ? chatData.history : []
      newChatdata.push({ role: "user", content: data.message })
      newChatdata.push({ role: "assistant", content: response.data.choices[0].message.content })
      console.log(chatData)
      await db.collection('Chats').doc(data.roomID + '_' + data.fromUser.userName).set(
        {
          response: response.data.choices[0].message.content,
          history: newChatdata
        },
        { merge: true }
      );
      return res.status(200).json({
        success: true,
        message: response.data.choices[0].message.content,
        userID: data.fromUser.userID
      });
    } catch (error) {
      return res.status(501).json({
        success: false,
        message: error,
      });
    }
  },
  //*Save today sugar level
  saveTodaySugarLevel: async (req, res) => {
    try {
      const { username, sugarLevel } = req.body;
      console.log(username, sugarLevel);
      var today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      const yyyy = String(today.getFullYear());
      console.log(dd, mm, yyyy);
      today = yyyy + "-" + mm + "-" + dd;
      console.log(today);
      const user = await db.collection("Users").doc(username).get();
      if (!user) {
        res.status(501).json({
          success: false,
          message: "User not found",
        });
      } else {
        await db
          .collection("Users")
          .doc(username)
          .collection("Reports")
          .doc(today)
          .set(
            {
              sugarLevel: sugarLevel,
              date: dd + "/" + mm + "/" + yyyy,
            },
            { merge: true }
          );
        res.status(200).json({
          success: true,
          message: "Sugar level saved",
          sugarLevel: sugarLevel,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region

  //*Region save today BMI
  saveTodayBMI: async (req, res) => {
    try {
      const { username, BMI } = req.body;
      var today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      const yyyy = String(today.getFullYear());
      console.log(dd, mm, yyyy);
      today = yyyy + "-" + mm + "-" + dd;
      console.log(today);
      const user = await db.collection("Users").doc(username).get();
      if (!user) {
        res.status(501).json({
          success: false,
          message: "User not found",
        });
      } else {
        await db
          .collection("Users")
          .doc(username)
          .collection("Reports")
          .doc(today)
          .set(
            {
              BMI: BMI,
              date: dd + "/" + mm + "/" + yyyy,
            },
            { merge: true }
          );
        res.status(200).json({
          success: true,
          message: "BMI saved",
          BMI: BMI,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region
  //*Region save today BMI
  createPrescription: async (req, res) => {
    try {
      const { date, diagnostic, doctorName, duration, medicineList } = req.body;
      const user = await db.collection("Users").doc(req.params.username).get();
      if (!user) {
        res.status(201).json({
          success: false,
          message: "User not found",
        });
      } else {
        await db
          .collection("Users")
          .doc(req.params.username)
          .collection("Prescription")
          .doc(date)
          .set({
            date: date,
            diagnostic: diagnostic,
            doctorName: doctorName,
            duration: duration,
            medicineList: medicineList,
            status: req.body.status ? req.body.status : "Unfinished",
            patientUsername: req.params.username,
          });
        res.status(200).json({
          success: true,
          message: "Prescription saved",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  getAllPrescription: async (req, res) => {
    try {
      const { username } = req.params;
      const user = await db.collection("Users").doc(username).get();
      if (!user) {
        res.status(201).json({
          success: false,
          message: "User not found",
        });
      } else {
        const snapshot = await db
          .collection("Users")
          .doc(username)
          .collection("Prescription")
          .get();
        res.status(200).json({
          success: true,
          message: snapshot.docs.map((doc) => doc.data()),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region

  //*Region Get today sugar level
  getTodayReport: async (req, res) => {
    try {
      const { username } = req.body;
      console.log(username);
      var today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      const yyyy = String(today.getFullYear());
      console.log(dd, mm, yyyy);
      today = yyyy + "-" + mm + "-" + dd;
      console.log(today);
      const user = await db.collection("Users").doc(username).get();
      if (!user) {
        res.status(501).json({
          success: false,
          message: "User not found",
        });
      } else {
        const snapshot = await db
          .collection("Users")
          .doc(username)
          .collection("Reports")
          .doc(today)
          .get();
        res.status(200).json({
          success: true,
          message: snapshot.data(),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region

  //*Region Get all report
  getAllReport: async (req, res) => {
    try {
      const { username } = req.body;
      console.log(username);
      const user = await db.collection("Users").doc(username).get();
      if (!user) {
        res.status(501).json({
          success: false,
          message: "User not found",
        });
      } else {
        const snapshot = await db
          .collection("Users")
          .doc(username)
          .collection("Reports")
          .get();
        res.status(200).json({
          success: true,
          message: snapshot.docs.map((doc) => doc.data()),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },

  createService: async (req, res) => {
    try {
      const { legalName, idType, idNumber, publishedDate, publishedLocation } = req.body;
      var today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      const yyyy = String(today.getFullYear());
      console.log(dd, mm, yyyy);
      today = yyyy + "-" + mm + "-" + dd;
      console.log(today);
      const user = await db.collection("Users").doc(req.params.username).get();
      if (!user) {
        res.status(201).json({
          success: false,
          message: "User not found",
        });
      } else {
        await db
          .collection("Users")
          .doc(req.params.username)
          .collection("Service")
          .doc(req.body.date ? req.body.date : today)
          .set({
            legal_name: legalName,
            id_type: idType,
            id_number: idNumber,
            status: req.body.status ? req.body.status : "Unfinished",
            published_date: publishedDate,
            published_location: publishedLocation,
            date: req.body.date ? req.body.date : today
          });
        res.status(200).json({
          success: true,
          message: "Request created",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  getAllService: async (req, res) => {
    try {
      const { username } = req.params;
      console.log(username);
      const user = await db.collection("Users").doc(username).get();
      if (!user) {
        res.status(201).json({
          success: false,
          message: "User not found",
        });
      } else {
        const snapshot = await db
          .collection("Users")
          .doc(username)
          .collection("Service")
          .get();
        res.status(200).json({
          success: true,
          message: snapshot.docs.map((doc) => doc.data()),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  getAllServiceFromEveryUser: async (req, res) => {
    try {
      const userSnapshots = await db.collection("Users").get();
      const services = [];
      for (const userSnapshot of userSnapshots.docs) {
        const serviceSnapshots = await userSnapshot
          .ref.collection("Service")
          .get();

        for (const serviceSnapshot of serviceSnapshots.docs) {
          services.push({
            userId: userSnapshot.id,
            ...serviceSnapshot.data()
          });
        }
      }
      if (services) {
        res.status(200).json({
          success: true,
          message: services,
        });
      } else {

        res.status(201).json({
          success: true,
          message: "No request",
        });
      }

    }
    catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
};
