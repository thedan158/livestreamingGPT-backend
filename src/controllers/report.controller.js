import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import crypto from "crypto"
import axios from "axios";

dotenv.config()
console.log(process.env.API_KEY)
const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.API_KEY })
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
  sendMessage: async (req, res) => {
    try {

    } catch (error) {

    }
  },
  requestAI: async (req, res) => {
    try {
      const data = req.body
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
      await db.collection('Chats').doc(data.roomID + '_' + data.fromUser.userName).set(data)
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: data.message }]
      })
      if (!response)
        return res.status(201).json({
          success: false,
          message: "Cant get data from openai",
        });
      await db.collection('Chats').doc(data.roomID + '_' + data.fromUser.userName).set(
        {
          response: response.data.choices[0].message.content
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
