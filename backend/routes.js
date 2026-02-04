const express = require("express");
const router = express.Router();
const usersRoutes = require("./main/users/userRoute");
const productCrudRoute = require("./routes/product/productCrudRoute");
const productFilterRoute = require("./routes/product/productFilterRoute");
const productSkillMatchRoute = require("./routes/productSkillMatchRoute");
const productsRoutes = require("./routes/productRoute");
const productQtyRoutes = require("./routes/productQtyRoute");
const ordersRoutes = require("./main/orders/orderRoute");
const cartRoutes = require("./routes/cartRoute");
const wishlistRoutes = require("./routes/wishlistRoute");
const storeRoutes = require("./routes/storeRoute");
const notifyProductRoutes = require("./routes/notifyProductRoute");
const toyWalletRoutes = require("./routes/toyWalletRoute");
const walletHistoryRoutes = require("./routes/walletHistoryRoute");
const blockToyRoutes = require("./routes/blockToyRoute");
const challangeRoute = require("./routes/challangeRoute");
// const connectToMongoDB = require("./config");
const giftcardformRoutes = require("./routes/giftcardformRoute");
const skillQuestionRoute = require("./routes/skillQuestionRoute");

const imageRoute = require("./routes/common/imageRoute");
const razorpay = require("./routes/common/razorpay");
const search = require("./routes/searchRoute");
const sellerRoute = require("./routes/sellerRoute");
const relatedProducts = require("./routes/relatedProducts");
const flashCard = require("./routes/flashCard");
const userReminderRoute = require("./main/users/components/reminders/userReminderRoute");
const personalizedProductsRoute = require("./routes/personalizedProductsRoute");
const blogs = require("./routes/blogsRoute");
const magazineRoute = require("./routes/magazineRoute");
const parentUserRoute = require("./main/parenting/users/parentUserRoute");
const parentPost = require("./main/parenting/posts/postRoute");
const eventRoute = require("./main/parenting/events/eventRoute");
const paymentRequest = require("./routes/paymentRequest");
const twilioServiceRoute = require("./routes/twilioServiceRoute");
const suggestedProducts = require("./routes/suggestedProducts");
const scratchCardRoute = require("./routes/scratchCard");
const firebaseRoute = require("./routes/firebaseRoute");
const productLikes = require("./routes/productLikes");
const skicryReviews = require("./routes/skipcryReviews");
const marketFilter = require("./routes/marketFilterRoute");
const communityRoute = require("./main/parenting/communities/communityRoute");
const groupRoute = require("./main/parenting/groups/groupRoute");
const groupPostRoute = require("./main/parenting/groups/groupPostRoute");
const expertApplicationRoute = require("./main/parenting/expert-application/expertApplicationRoute");
const couponsRoute = require("./routes/couponsRoute");
const curatedBoxRoute = require("./routes/curatedBoxRoute");
const locationRoute = require("./routes/locationRoute");
const assessmentRoute = require("./routes/assessmentRoute");
const kidRoute = require("./routes/kidRoute");

const skillActivityRoute = require("./routes/skillActivityRoute");

const dashboardRoute = require("./main/dashboard/dashboardRoute");

const oneOnOneSessionRoute = require("./routes/oneOnOneSessionRoute");


const axios = require('axios');

router.get("/api/instagram-embed", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Check if URL is a valid Instagram post or reel URL
    const postRegex = /^https:\/\/www\.instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+\/?(\?.*)?$/;
    if (!postRegex.test(url)) {
      return res.status(400).json({ error: 'Invalid Instagram post or reel URL' });
    }

    // Return official Instagram embed code
    const cleanUrl = url.split('?')[0]; // Remove query params
    const html = `<blockquote class="instagram-media" data-instgrm-permalink="${cleanUrl}" data-instgrm-version="14" style="max-width:400px; width:100%;"><div><a href="${cleanUrl}" target="_blank">View this post on Instagram</a></div></blockquote><script async src="//www.instagram.com/embed.js"></script>`;

    res.json({
      html,
      width: 400,
      height: 400,
      type: 'rich'
    });
  } catch (error) {
    console.error('Instagram embed error:', error.message);
    res.status(500).json({ error: 'Failed to generate embed' });
  }
});

router.use("/api/users", usersRoutes);
router.use("/api/userReminder", userReminderRoute);
router.use("/api/productCrud", productCrudRoute);
router.use("/api/productFilter", productFilterRoute);
router.use("/api/productSkillMatch", productSkillMatchRoute);
router.use("/api/products", productsRoutes);
router.use("/api/productQty", productQtyRoutes);
router.use("/api/orders", ordersRoutes);
router.use("/api/cart", cartRoutes);
router.use("/api/wishlist", wishlistRoutes);
router.use("/api/stores", storeRoutes);
router.use("/api/notifyProduct", notifyProductRoutes);
router.use("/api/toyWallet", toyWalletRoutes);
router.use("/api/walletHistory", walletHistoryRoutes);
router.use("/api/blockToy", blockToyRoutes);
router.use("/api/challange", challangeRoute);
router.use("/api/skillQuestions", skillQuestionRoute);
router.use("/api/giftcard_form", giftcardformRoutes);
router.use("/api/images", imageRoute);
router.use("/api/payment", razorpay);
router.use("/api/search", search);
router.use("/api/seller", sellerRoute);
router.use("/api/related-products", relatedProducts);
router.use("/api/flashCard", flashCard);
router.use("/api/personalized-products", personalizedProductsRoute);
router.use("/api/blogs", blogs);
router.use("/api/magazines", magazineRoute);
router.use("/api/parenting/users", parentUserRoute);
router.use("/api/parenting/posts", parentPost);
router.use("/api/parenting/events", eventRoute);
router.use("/api/payment-requests", paymentRequest);
router.use("/api/twilio", twilioServiceRoute);
router.use("/api/suggested-products", suggestedProducts);
router.use("/api/scratchCards", scratchCardRoute);
router.use("/api/product-likes/", productLikes);
router.use("/api/skipcry", skicryReviews);
router.use("/api/marketFilter", marketFilter);
router.use("/api/parenting/communities", communityRoute);
router.use("/api/parenting/groups", groupRoute);
router.use("/api/parenting/group-posts", groupPostRoute);
router.use("/api/parenting/expert-application", expertApplicationRoute);
router.use("/api/coupon", couponsRoute);
router.use("/api/curatedBoxes", curatedBoxRoute);
router.use("/api/location", locationRoute);
router.use("/api/assessments", assessmentRoute);
router.use("/api/kids", kidRoute);


router.use("/api/skillActivities", skillActivityRoute);



router.use("/api/dashboard", dashboardRoute);

router.use("/api/one-on-one-sessions", oneOnOneSessionRoute);

router.use("/api/auth", firebaseRoute);
module.exports = router;
