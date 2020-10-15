import mongoose from 'mongoose';

const MONGOOSE_OPTIONS = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connect = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI, MONGOOSE_OPTIONS);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

export { connect };
