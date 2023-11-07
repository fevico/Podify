import { getAutoGeneratedPlaylist, getFollowerProfile, getFollowerProfilePublic, getFollowingsProfile, getPublicPlaylist, getPublicProfile, getPublicUploads, getRecommendedByprofile, getUploads, updateFollower } from "#/controller/profile";
import { isAuth, mustAuth } from "#/middleware/auth";
import { Router } from "express";

const router = Router()

router.post("/update-follower/:profileId", mustAuth, updateFollower);
router.get("/uploads/", mustAuth, getUploads)
router.get("/uploads/:profileId", getPublicUploads)
router.get("/info/:profileId", getPublicProfile)
router.get("/playlist/:profileId", getPublicPlaylist)
router.get("/recomended", isAuth, getRecommendedByprofile)
router.get("/auto-generated-playlist", mustAuth, getAutoGeneratedPlaylist)
router.get("/followers", mustAuth, getFollowerProfile)
router.get("/followers/:profileId", mustAuth, getFollowerProfilePublic)
router.get("/followings", mustAuth, getFollowingsProfile)

export default router;