import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

import { UserDocument } from '../types';

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String, select: false },
});

userSchema.pre<UserDocument>('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(this.password, salt);

    this.password = hash;
  }

  next();
});

userSchema.methods.comparePassword = function(password: string) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<UserDocument>('User', userSchema);
