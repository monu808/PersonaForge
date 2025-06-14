import express from 'express';
import { createTavusReplica, createTavusPersona, createTavusConversation } from '../../lib/api/tavus';
import { authenticateUser } from '../middleware/auth';
import { validateRateLimit } from '../middleware/rate-limit';

const router = express.Router();

// Middleware
router.use(authenticateUser);
router.use(validateRateLimit);

/**
 * POST /api/tavus/replicas
 * Create a new Tavus replica
 */
router.post('/replicas', async (req, res) => {
  try {
    const { replica_name, train_video_url } = req.body;

    if (!replica_name || !train_video_url) {
      return res.status(400).json({
        error: 'replica_name and train_video_url are required'
      });
    }

    // Add callback URL for webhook notifications
    const callbackUrl = `${process.env.BASE_URL}/api/tavus/webhook/replica`;

    const result = await createTavusReplica({
      replica_name,
      train_video_url,
      callback_url: callbackUrl
    });

    if (result.error) {
      return res.status(400).json({
        error: result.error,
        status: result.status
      });
    }

    res.json({
      replica_id: result.replica_id,
      status: result.status,
      message: result.message || 'Replica creation initiated successfully'
    });

  } catch (error) {
    console.error('Error in replica creation endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/tavus/personas
 * Create a new Tavus persona
 */
router.post('/personas', async (req, res) => {
  try {
    const { persona_name, replica_id, personality_layers } = req.body;

    if (!persona_name) {
      return res.status(400).json({
        error: 'persona_name is required'
      });
    }

    const result = await createTavusPersona({
      persona_name,
      replica_id,
      personality_layers
    });

    if (result.error) {
      return res.status(400).json({
        error: result.error,
        status: result.status
      });
    }

    res.json({
      persona_id: result.persona_id,
      status: result.status,
      message: result.message || 'Persona created successfully'
    });

  } catch (error) {
    console.error('Error in persona creation endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/tavus/conversations
 * Create a new Tavus conversation
 */
router.post('/conversations', async (req, res) => {
  try {
    const { persona_id, conversation_name, properties } = req.body;

    if (!persona_id) {
      return res.status(400).json({
        error: 'persona_id is required'
      });
    }

    // Add callback URL for webhook notifications
    const callbackUrl = `${process.env.BASE_URL}/api/tavus/webhook/conversation`;

    const result = await createTavusConversation({
      persona_id,
      conversation_name,
      callback_url: callbackUrl,
      properties
    });

    if (result.error) {
      return res.status(400).json({
        error: result.error,
        status: result.status
      });
    }

    res.json({
      conversation_id: result.conversation_id,
      conversation_url: result.conversation_url,
      status: result.status,
      message: result.message || 'Conversation created successfully'
    });

  } catch (error) {
    console.error('Error in conversation creation endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
