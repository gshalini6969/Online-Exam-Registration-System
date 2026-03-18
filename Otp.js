// import mongoose from "mongoose";

// const otpSchema = new mongoose.Schema({
//   email: { type: String, required: true },
//   code: { type: String, required: true },
//   purpose: { type: String, required: true },
//   expiresAt: { type: Date, required: true },
//   verified: { type: Boolean, default: false } // <-- add this
// });

// export default mongoose.model("Otp", otpSchema);

import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  purpose: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false } // <-- add this
});

export default mongoose.model("Otp", otpSchema);