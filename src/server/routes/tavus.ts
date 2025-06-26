import express from 'express';
import { createTavusReplica, createTavusPersona, createTavusConversation } from '../../lib/api/tavus';
import { createLiveEvent } from '../../lib/api/events';
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
    const { replica_id, persona_id, conversation_name, conversation_context, properties } = req.body;

    if (!replica_id) {
      return res.status(400).json({
        error: 'replica_id is required'
      });
    }

    if (!persona_id) {
      return res.status(400).json({
        error: 'persona_id is required'
      });
    }

    // Note: conversation_context is only used locally, not sent to TAVUS API
    // Add callback URL for webhook notifications
    const callbackUrl = `${process.env.BASE_URL}/api/tavus/webhook/conversation`;

    const result = await createTavusConversation({
      replica_id,
      persona_id,
      conversation_name,
      conversation_context,
      callback_url: callbackUrl,
      properties
    });

    if (result.error) {
      return res.status(400).json({
        error: result.error,
        status: result.status
      });
    }

    // Create a live event for this conversation
    try {
      await createLiveEvent({
        title: conversation_name || 'Live Conversation',
        description: 'Live video conversation with AI persona',
        host_replica_id: replica_id,
        participants: [],
        status: 'live',
        start_time: new Date().toISOString(),
        duration: 60, // Default duration
        type: 'video_call',
        visibility: 'public',
        max_participants: 10,
        room_url: result.conversation_url || undefined
      });
    } catch (eventError) {
      console.error('Failed to create live event:', eventError);
      // Don't fail the whole request if event creation fails
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
