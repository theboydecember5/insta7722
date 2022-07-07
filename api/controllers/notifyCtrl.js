const Notifies = require("../models/notifyModal");

const notifyCtrl = {
    createNotify: async (req, res) => {
        try {
            const { id, recipients, url, text, content, image } = req.body;

            if (recipients.includes(req.user._id.toString())) return;

            const notify = new Notifies({
                id,
                recipients,
                url,
                text,
                content,
                image,
                user: req.user._id,
            });

            await notify.save();
            return res.json({ notify });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    removeNotify: async (req, res) => {
        try {
            const notify = await Notifies.findOneAndDelete({
                id: req.params.id,
                url: req.query.url,
            });

            return res.json({ notify });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    getNotify: async (req, res) => {
        try {
            const notifies = await Notifies.find({ recipients: req.user._id })
                .sort("createdAt")
                .populate("user", "avatar username");
            return res.json({ notifies });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    isRead: async (req, res) => {
        try {
            const notifies = await Notifies.findOneAndUpdate(
                { _id: req.params.id },
                {
                    isRead: true,
                }
            );
            return res.json({ notifies });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    deleteAllNotify: async (req, res) => {
     try {
          const notifies = await Notifies.deleteMany({recipients: req.user._id})
          return res.json({ notifies });
     } catch (error) {
        return res.status(500).json({ msg: error.message });
     }
    },
};

module.exports = notifyCtrl;
