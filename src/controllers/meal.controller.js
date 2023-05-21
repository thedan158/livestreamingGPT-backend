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

export const MealController = {
  //Get all breakfast
  getAllMeal: async (req, res) => {
    const { type } = req.params;
    console.log(type);
    try {
      const snapshot = await db
        .collection("Meals")
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

  addMeal: async (req, res) => {
    const { type, name, price, imagePath } = req.body;
    try {
      const snapshot = await db
        .collection("Meals")
        .add({
          type: type,
          name: name,
          price: price,
          imagePath: imagePath,
        });
      res.status(200).json({
        success: true,
        message: "Meal is added",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },





};
