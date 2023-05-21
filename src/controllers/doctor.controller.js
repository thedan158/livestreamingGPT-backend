import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  admin.app();
}
const db = admin.firestore();

export const DoctorController = {
  getPatientMessages: async (req, res) => {
    try {
      const user = await db.collection("Users").doc(req.params.username).get();
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }
      const snapshot = await db
        .collection("Users")
        .doc(req.params.username)
        .collection("chats")
        .get();
      if (!snapshot) {
        res.status(404).json({
          success: false,
          message: "No messages",
        });
        return;
      }
      console.log(snapshot.docs);
      const messages = snapshot.docs.map((doc) => doc.data());
      res.status(200).json({
        success: true,
        message: messages,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*Region Get all Doctors
  getAllDoctor: async (req, res) => {
    try {
      const user = db.collection("Users");
      const snapshot = await user.where("role", "==", "doctor").get();
      snapshot.forEach((doc) => {
        console.log(doc.data());
      });
      res.status(200).json({
        success: true,
        message: snapshot.docs.map((doc) => doc.data()),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  getAllMedicine: async (req, res) => {
    const { type } = req.params;
    console.log(type);
    try {
      const snapshot = await db
        .collection("Pill")
        .where("type", "==", type)
        .get();
      res.status(200).json({
        success: true,
        message: snapshot.docs.map((doc) => doc.data()),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
};
