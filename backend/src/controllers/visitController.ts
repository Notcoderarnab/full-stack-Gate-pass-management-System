import { Response } from 'express';

import { z } from 'zod';

import { AuthRequest } from '../middlewares/authMiddleware';

import { Visit } from '../models/Visit';

import { User } from '../models/User';
import { expireApprovedVisits } from '../utils/visitExpiry';


// ─────────────────────────────────────────────
// VALIDATION SCHEMA
// ─────────────────────────────────────────────

const createVisitSchema = z.object({

  hostId: z.string().min(
    1,
    'Host ID required'
  ),

  purposeOfVisit: z.string().min(
    5,
    'Purpose must be at least 5 characters'
  ),

  visitDate: z.string().datetime(
    'Invalid date format'
  ),

  visitTimeSlot: z.string().min(
    1,
    'Time slot required'
  ),

  gate: z.string().trim().min(1).max(50).optional(),

  guestNote: z.string().optional(),

});


// ─────────────────────────────────────────────
// CREATE VISIT
// ─────────────────────────────────────────────

export const createVisit = async (

  req: AuthRequest,

  res: Response

) => {

  try {

    const parsed =
      createVisitSchema.safeParse(req.body);


    if (!parsed.success) {

      return res.status(400).json({

        success: false,

        errors: parsed.error.flatten()

      });

    }


    const {

      hostId,

      purposeOfVisit,

      visitDate,

      visitTimeSlot,

      gate,

      guestNote

    } = parsed.data;


    // CHECK HOST

    const host = await User.findOne({

      _id: hostId,

      role: 'HOST',

      isActive: true

    });


    if (!host) {

      return res.status(404).json({

        success: false,

        message: 'Host not found'

      });

    }


    // CREATE VISIT

    const visit = await Visit.create({

      guestId: req.user!.id,

      hostId,

      purposeOfVisit,

      visitDate: new Date(visitDate),

      visitTimeSlot,

      gate: gate || 'Gate A',

      guestNote,

      status: 'PENDING',

    });


    // POPULATE HOST DETAILS

    const populated = await visit.populate([

      {

        path: 'hostId',

        select: 'name email department'

      }

    ]);


    return res.status(201).json({

      success: true,

      visit: populated

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message: 'Failed to create visit'

    });

  }

};


// ─────────────────────────────────────────────
// GET MY VISITS
// ─────────────────────────────────────────────

export const getMyVisits = async (

  req: AuthRequest,

  res: Response

) => {

  try {
    await expireApprovedVisits();

    const visits = await Visit.find({

      guestId: req.user!.id

    })

      .populate(

        'hostId',

        'name department'

      )

      .sort({

        createdAt: -1

      });


    return res.json({

      success: true,

      visits

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message: 'Failed to fetch visits'

    });

  }

};


// ─────────────────────────────────────────────
// GET VISIT BY ID
// ─────────────────────────────────────────────

export const getVisitById = async (

  req: AuthRequest,

  res: Response

) => {

  try {
    await expireApprovedVisits();

    const visit = await Visit.findOne({

      _id: req.params.id,

      guestId: req.user!.id

    })

      .populate(

        'hostId',

        'name department'

      );


    if (!visit) {

      return res.status(404).json({

        success: false,

        message: 'Visit not found'

      });

    }


    return res.json({

      success: true,

      visit

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message: 'Failed to fetch visit'

    });

  }

};


// ─────────────────────────────────────────────
// CANCEL VISIT
// ─────────────────────────────────────────────

export const cancelVisit = async (

  req: AuthRequest,

  res: Response

) => {

  try {

    const visit = await Visit.findOne({

      _id: req.params.id,

      guestId: req.user!.id

    });


    if (!visit) {

      return res.status(404).json({

        success: false,

        message: 'Visit not found'

      });

    }


    if (visit.status !== 'PENDING') {

      return res.status(400).json({

        success: false,

        message:
          `Cannot cancel a visit with status: ${visit.status}`

      });

    }


    await Visit.findByIdAndDelete(
      req.params.id
    );


    return res.json({

      success: true,

      message:
        'Visit cancelled successfully'

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to cancel visit'

    });

  }

};


// ─────────────────────────────────────────────
// GET ALL HOSTS
// ─────────────────────────────────────────────

export const getHosts = async (

  req: AuthRequest,

  res: Response

) => {

  try {

    const hosts = await User.find({

      role: 'HOST',

      isActive: true

    })

      .select(

        'name email department'

      );


    return res.json({

      success: true,

      hosts

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch hosts'

    });

  }

};
