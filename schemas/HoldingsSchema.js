const {Schema} = require("mongoose");

const HoldingsSchema = new Schema({
        // Basic Identification
  user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User reference is required"],
        index: true
      },
      symbol: {
        type: String,
        required: [true, "Stock symbol is required"],
        uppercase: true,
        trim: true,
        validate: {
          validator: function(v) {
            return /^[A-Z]{1,5}(\.[A-Z]{1,3})?$/.test(v); // PSX symbol format (e.g., "OGDC" or "FFBL.IS")
          },
          message: props => `${props.value} is not a valid stock symbol`
        }
      },
      // Pakistan Market Specifics
  exchange: {
        type: String,
        enum: ["PSX", "NASDAQ", "NYSE", "LSE", "KSE"],
        default: "PSX"
      },
      sector: {
        type: String,
        enum: ["Banking", "Energy", "Cement", "Textile", "Technology", "Chemical", "Food", "Automobile", "Other"],
        required: true
      },
      isShariaCompliant: {
        type: Boolean,
        default: false
      },
      // Holding Details
  quantity: {
        type: Number,
        required: true,
        min: [0, "Quantity cannot be negative"]
      },
      // Performance Metrics
  netChangePercent: {
        type: Number,
        required: true
      },
      dayChangePercent: {
        type: Number,
        required: true
      },
      annualDividendYield: {
        type: Number,
        default: 0
      },
      // Timestamps
  lastUpdated: {
        type: Date,
        default: Date.now
      },
      purchaseDate: {
        type: Date,
        default: Date.now
      }
    }, {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    });
//         name: String,
//         qty: Number,
//         avg: Number,
//         price: Number,
//         net: String,
//         day: String
// });
// Virtual Fields (Calculated Properties)
HoldingsSchema.virtual('currentValue').get(function() {
        return this.quantity * this.currentPrice;
      });
      
      HoldingsSchema.virtual('profitLoss').get(function() {
        return (this.currentPrice - this.averagePrice) * this.quantity;
      });
      
      HoldingsSchema.virtual('profitLossPercent').get(function() {
        return ((this.currentPrice - this.averagePrice) / this.averagePrice) * 100;
      });

      // Indexes for Performance
HoldingsSchema.index({ user: 1, symbol: 1 }, { unique: true });
HoldingsSchema.index({ exchange: 1 });
HoldingsSchema.index({ sector: 1 });
HoldingsSchema.index({ isShariaCompliant: 1 });

// Pre-save Hook for PSX Stocks
HoldingsSchema.pre('save', function(next) {
        // Normalize PSX symbols
        if (this.exchange === 'PSX') {
          this.symbol = this.symbol.split('.')[0].toUpperCase(); // Remove .IS suffix if present
        }

        // Auto-calculate investment if not provided
  if (!this.investment) {
        this.investment = this.quantity * this.averagePrice;
      }

      next();
});


module.exports = { HoldingsSchema };