import { PopulatedFavList } from "#/@types/audio";
import Audio, { AudioDocument } from "#/models/audio";
import Favourite from "#/models/favourite";
import { RequestHandler } from "express-serve-static-core";
import { isValidObjectId } from "mongoose";

export const toggleFavourite: RequestHandler = async (req, res) => {
    // audio already in favorite list 
    const audioId = req.query.audioId as string
    let status: "added" | "removed";

    if (!isValidObjectId(audioId)) return res.status(422).json({ error: "Audio id is invalid!" });

    const audio = await Audio.findById(audioId);
    if (!audio) return res.status(404).json({ error: "Resource not found!" })

    // audio already in the list 
    const alreadyExist = await Favourite.findOne({ owner: req.user.id, items: audioId });
    if (alreadyExist) {
        // we want to remove from old list 
        await Favourite.updateOne({ owner: req.user.id }, {
            $pull: { items: audioId }
        })
        status = "removed"
    } else {
        const favorite = await Favourite.findOne({ owner: req.user.id })
        if (favorite) {
            // trying to add new audio to old list
            await Favourite.updateOne({ owner: req.user.id }, {
                $addToSet: { items: audioId }
            })
        } else {
            // tring to create fresh fav list 
            await Favourite.create({ owner: req.user.id, items: [audioId] })
        }
        status = "added"
    }

    if (status === "added") {
        await Audio.findByIdAndUpdate(audioId, {
            $addToSet: { likes: req.user.id }
        })
    }

    if (status === "removed") {
        await Audio.findByIdAndUpdate(audioId, {
            $pull: { likes: req.user.id }
        })
    }
    res.json({ status });
}

export const getFavourites: RequestHandler = async (req, res) => {
    const userID = req.user.id;
    const favourite = await Favourite.findOne({ owner: userID })
        .populate<{ items: PopulatedFavList[] }>({
            path: "items",
            populate: {
                path: "owner",
            }
        });
    if (!favourite) return res.json({ audios: [] })
    const audios = favourite.items.map((item) => {
        return {
            id: item._id,
            title: item.title,
            category: item.category,
            file: item.file.url,
            poster: item.poster?.url,
            owner: { name: item.owner.name, id: item.owner._id }
        }
    })
    res.json({ audios });
}

export const getIsFavourite: RequestHandler = async (req, res) => {
    const audioId = req.query.audioId as string

    if(!isValidObjectId(audioId)) return res.json({error: "invalid error id!"})

    const favourite = await Favourite.findOne({ owner: req.user.id, items: audioId })
        
    res.json({ result: favourite ? true : false });
}