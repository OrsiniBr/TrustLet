// const userSchema = new mongoose.Schema({
//   chatId: { type: String, required: true, unique: true },
//   // ... other user fields like name, email, etc.
//   hasDeposited: {
//     type: Boolean,
//     default: false,
//   },
//   // OR, more flexibly, track which specific contracts they've used
//   depositedContracts: [
//     {
//       contractAddress: String,
//       depositedAt: { type: Date, default: Date.now },
//     },
//   ],
// });
// module.exports = mongoose.model("User", userSchema);


// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");

// // GET endpoint to check if a user has deposited
// router.get("/:chatId/has-deposited", async (req, res) => {
//   try {
//     const user = await User.findOne({ chatId: req.params.chatId });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     // Check against a specific contract if needed
//     // const hasDeposited = user.depositedContracts.some(c => c.contractAddress === contractAddress);
//     res.json({ hasDeposited: user.hasDeposited });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // POST endpoint to mark a user as having deposited
// router.post("/:chatId/deposit", async (req, res) => {
//   try {
//     const { contractAddress } = req.body; // Optional: if tracking specific contracts

//     const user = await User.findOneAndUpdate(
//       { chatId: req.params.chatId },
//       {
//         $set: { hasDeposited: true },
//         // OR if using the array approach:
//         $addToSet: { depositedContracts: { contractAddress } }, // $addToSet prevents duplicates
//       },
//       { new: true, upsert: true } // `upsert: true` creates the user if they don't exist
//     );
//     res.json({ success: true, user });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;


// const handleStake = async () => {
//   // 1. Check backend first BEFORE any blockchain interaction
//   try {
//     const checkResponse = await axios.get(`/api/user/${chatId}/has-deposited`);
//     if (checkResponse.data.hasDeposited) {
//       alert("You have already claimed your deposit reward!");
//       return; // Exit early
//     }
//   } catch (error) {
//     console.error("Failed to check deposit status:", error);
//     return;
//   }

//   // 2. Proceed with staking if check passes
//   if (isStaking) return;
//   setIsStaking(true);

//   try {
//     // 3. Execute the blockchain transaction
//     await stake();

//     // 4. ONLY IF successful, call the backend to permanently mark the user
//     await axios.post(`/api/user/${chatId}/deposit`, {
//       contractAddress: "0x3Ed7f2D4C1668C5641A53Ce52da0a63A82D4256E" // Your contract address
//     });

//     // 5. Optional: Update local state for better UX
//     // setHasDeposited(true); 

//   } catch (error) {
//     console.error("Staking failed:", error);
//   } finally {
//     setIsStaking(false);
//   }
// };

// // You can remove the frontend hasDeposited(chatId) function entirely
// // as it's now handled by the backend.