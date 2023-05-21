import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//*Region connect to database
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  admin.app();
}
function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const db = admin.firestore();
//*End region
export const AuthController = {
  //*Login user
  loginUser: async (req, res) => {
    const usernameLowerCase = req.body.username.toLowerCase()
    const user = await db.collection("Users").doc(usernameLowerCase).get();
    try {
      console.log(user.data());
      if (!user) {
        res.status(201).json({
          success: false,
          message: "User not found",
        });
      } else {
        const isMatchPassword = await bcrypt.compare(
          req.body.password,
          user.data().password
        );
        if (!isMatchPassword) {
          res.status(201).json({
            success: false,
            message: "Incorrect username or password",
          });
        } else {
          res.status(200).json({
            success: true,
            message: "User Logged in",
            data: user.data()
          });
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region

  //*Region Register Account
  registerUser: async (req, res) => {
    try {
      const user = await db.collection("Users").doc(req.body.username).get();
      console.log(user.data());
      if (user.data() != undefined) {
        res.status(201).json({
          success: false,
          message: "Username existed",
        });
      } else {
        const isValidPassword = validator.isLength(req.body.password, 8, 30);
        if (!isValidPassword) {
          res.status(201).json({
            success: false,
            message: "Password length must from 8 to 30 characters",
          });
        }
        if (isValidPassword) {
          const id = generateRandomString()
          await db
            .collection("Users")
            .doc(req.body.username)
            .set({
              id: id,
              username: req.body.username,
              password: await bcrypt.hash(req.body.password, 10),
              role: 'user',
              imagePath:
                "https://firebasestorage.googleapis.com/v0/b/le-repas.appspot.com/o/images%2Fgood.png?alt=media&token=de139437-3a20-4eb3-ba56-f6a591779d15",
            });
          res.status(200).json({
            success: true,
            message: "User created",
            data: {
              username: req.body.username,
              role: 'user',
              id: id
            }
          });
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region

  //*Region Get User
  getUserProfile: async (req, res) => {
    try {
      const user = await db.collection("Users").doc(req.params.username).get();
      if (!user.data()) {
        res.status(201).json({
          success: false,
          message: "Invalid username",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: user.data(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region

  //*Region Update User
  updateInfo: async (req, res) => {
    try {
      const user = await db.collection("Users").doc(req.params.username).get();
      if (!user.data()) {
        res.status(201).json({
          success: false,
          message: "Invalid username",
        });
        return;
      }
      await db.collection("Users").doc(req.params.username).set(
        {
          legal_name: req.body.legal_name,
          nationality: req.body.nationality,
          id_type: req.body.id_type,
          id_number: req.body.id_number,
          date_of_birth: req.body.date_of_birth,
          image_path: req.body.image_path,
          phone: req.body.phone,
          address: req.body.address
        },
        { merge: true }
      );
      res.status(200).json({
        success: true,
        message: "Profile Updated",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region

  //*Region change password
  changePassword: async (req, res) => {
    try {
      const user = await db.collection("Users").doc(req.body.username).get();
      console.log(user.data());
      if (!user) {
        return res.status(201).json({
          success: false,
          message: "User not found",
        });
      } else {
        const isMatchPassword = await bcrypt.compare(
          req.body.oldPassword,
          user.data().password
        );
        console.log("Matched Password:" + isMatchPassword);
        if (!isMatchPassword) {
          return res.status(201).json({
            success: false,
            message: "Incorrect password",
          });
        } else {
          if (req.body.newPassword === req.body.confirmPassword) {
            const isValidPassword = validator.isLength(
              req.body.newPassword,
              8,
              30
            );
            const isValidPassword1 = validator.isLength(
              req.body.confirmPassword,
              8,
              30
            );
            if (!isValidPassword || !isValidPassword1) {
              return res.status(201).json({
                success: false,
                message: "Password length must from 8 to 30 characters",
              });
            }
            console.log(req.body.newPassword + ". " + req.body.confirmPassword);
            const bcryptPassword = await bcrypt.hash(
              req.body.confirmPassword,
              10
            );
            console.log(bcryptPassword);
            await db.collection("Users").doc(req.body.username).update({
              password: bcryptPassword,
            });
            return res
              .status(200)
              .json({ success: true, message: "Password changed" });
          } else {
            return res.status(201).json({
              success: false,
              message: "Password confirm not match",
            });
          }
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  },
  //*End Region
  //*Region forgot password
  forgotPassword: async (req, res) => {
    try {
      console.log(req.body.phoneNumber);
      const userlists = db.collection("Users");
      const query = await userlists
        .where("phoneNumber", "==", req.body.phoneNumber)
        .get();
      if (query.empty) {
        console.log("No matching documents.");
        res.status(501).json({
          success: false,
          message: "User not found",
        });
        return;
      }
      query.forEach(async (doc) => {
        const isValidPassword = validator.isLength(req.body.newPassword, 8, 30);
        if (!isValidPassword) {
          res.status(501).json({
            success: false,
            message: "Password length must from 8 to 30 characters",
          });
          return;
        }
        console.log(doc.id, "=>", doc.data());
        const user = await db.collection("Users").doc(doc.id).get();
        const token = jwt.sign(
          { username: user.data().username },
          "secret",
          {}
        );
        await db
          .collection("Users")
          .doc(doc.id)
          .update({
            token: token,
            password: await bcrypt.hash(req.body.newPassword, 10),
          });
        res.status(200).json({
          success: true,
          message: "Password reseted",
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  //*End Region

  //*Region Check User Exist
  checkPhoneNumberInfo: async (req, res) => {
    try {
      const user = db.collection("Users");
      const snapshot = await user
        .where("phoneNumber", "==", req.params.phoneNumber)
        .get();
      if (snapshot.empty) {
        res.status(200).json({
          success: true,
          message: "PhoneNumber available",
        });
      } else {
        res.status(501).json({
          success: false,
          message: "PhoneNumber already exists",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  checkUsernameInfo: async (req, res) => {
    try {
      const user = await db.collection("Users").doc(req.params.username).get();
      if (user.data()) {
        res.status(501).json({
          success: false,
          message: "Username already exists",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Username available",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  searchProfile: async (req, res) => {
    try {
      const usersRef = db.collection("Users")
      const query = usersRef.where("id_number", "==", req.body.id_number);
      const querySnapshot = await query.get();
      if (querySnapshot.empty) {
        res.status(201).json({
          success: false,
          message: "This id number is not exist in the system",
        });
      } else {
        res.status(200).json({
          success: true,
          data: querySnapshot.docs[0].data(),
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
};
