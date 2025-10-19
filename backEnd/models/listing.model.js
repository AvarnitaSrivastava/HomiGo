const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",  // Changed to reference Owner model
      required: true,
    },
    ownerModel: {
      type: String,
      default: 'Owner',  // This helps us know which model to use for population
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    availableRooms: {
      type: Number,
      default: 1,
    },
    roomType: {
      type: String,
      enum: ["single", "shared", "apartment"],
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    // Room rents and availability structure
    rents: {
      single: {
        rent: { type: Number, default: 0 },
        available: { type: Boolean, default: false },
        count: { type: Number, default: 0 }
      },
      double: {
        rent: { type: Number, default: 0 },
        available: { type: Boolean, default: false },
        count: { type: Number, default: 0 }
      },
      triple: {
        rent: { type: Number, default: 0 },
        available: { type: Boolean, default: false },
        count: { type: Number, default: 0 }
      }
    },
    houseRules: { type: String, default: '' },
    whatsNearby: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    ownerPhone: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },
    propertyType: { type: String, default: '' },
    totalRooms: { type: Number, default: 0 },
    yearBuilt: { type: String, default: '' },
    furnished: { type: Boolean, default: false },
    preferences: {
      gender: {
        type: String,
        enum: ["male", "female", "any"],
        default: "any"
      },
      smoking: {
        type: Boolean,
        default: false
      },
      pets: {
        type: Boolean,
        default: false
      },
      foodPreferences: {
        type: String,
        enum: ["veg", "non-veg", "any"],
        default: "any"
      }
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  { timestamps: true }
);

const Listing = mongoose.model("Listing", listingSchema);

module.exports = { Listing };
