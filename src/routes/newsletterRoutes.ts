import express from 'express'
import { notify, subscribe } from '../controllers/newsletterController.js'

const router = express.Router()

router.post('/subscribe', subscribe)
router.post('/notify', notify)

export default router
