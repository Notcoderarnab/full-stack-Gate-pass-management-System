import { Response } from 'express';

import { randomUUID } from 'crypto';

import { AuthRequest } from '../middlewares/authMiddleware';

import { Visit } from '../models/Visit';

import { User } from '../models/User';

import { buildQrPayload, generateQRCode } from '../services/qrService';
import { expireApprovedVisits } from '../utils/visitExpiry';

import {

  sendApprovalEmail,

  sendRejectionEmail

} from '../services/emailService';


// ─────────────────────────────────────────────
// GET HOST REQUESTS
// ─────────────────────────────────────────────

export const getHostRequests = async (

  req: AuthRequest,

  res: Response

) => {

  try {
    await expireApprovedVisits();

    const { status } = req.query;

    const filter: Record<string, unknown> = {

      hostId: req.user!.id

    };


    if (status) {

      filter.status = status;

    }


    const visits = await Visit.find(filter)

      .populate(

        'guestId',

        'name email phone'

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

      message:
        'Failed to fetch requests'

    });

  }

};


// ─────────────────────────────────────────────
// HOST DASHBOARD
// ─────────────────────────────────────────────

export const getHostDashboard = async (

  req: AuthRequest,

  res: Response

) => {

  try {
    await expireApprovedVisits();

    const hostId = req.user!.id;


    const todayStart = new Date();

    todayStart.setHours(
      0,
      0,
      0,
      0
    );


    const todayEnd = new Date();

    todayEnd.setHours(
      23,
      59,
      59,
      999
    );


    const [

      pending,

      approved,

      rejected,

      expired,

      todayVisits

    ] = await Promise.all([

      Visit.countDocuments({

        hostId,

        status: 'PENDING'

      }),

      Visit.countDocuments({

        hostId,

        status: 'APPROVED'

      }),

      Visit.countDocuments({

        hostId,

        status: 'REJECTED'

      }),

      Visit.countDocuments({

        hostId,

        status: 'EXPIRED'

      }),

      Visit.countDocuments({

        hostId,

        visitDate: {

          $gte: todayStart,

          $lte: todayEnd

        }

      }),

    ]);


    return res.json({

      success: true,

      stats: {

        pending,

        approved,

        rejected,

        expired,

        todayVisits

      }

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch dashboard'

    });

  }

};


// ─────────────────────────────────────────────
// APPROVE VISIT
// ─────────────────────────────────────────────

export const approveVisit = async (

  req: AuthRequest,

  res: Response

) => {

  try {

    const visit = await Visit.findOne({

      _id: req.params.id,

      hostId: req.user!.id

    })

      .populate(

        'guestId',

        'name email'

      );


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
          'Visit is not in PENDING state'

      });

    }


    // GET HOST DETAILS

    const host = await User.findById(
      req.user!.id
    ).select('name');


    // GENERATE QR TOKEN

    const qrToken = randomUUID();


    // FRONTEND VERIFY URL

    const qrPayload = buildQrPayload(qrToken);


    // GENERATE QR IMAGE

    const qrCodeImageBase64 =
      await generateQRCode(qrPayload);


    // QR EXPIRY

    const expiresAt =
      new Date(visit.visitDate);

    expiresAt.setHours(
      23,
      59,
      59,
      999
    );


    // UPDATE VISIT

    visit.status = 'APPROVED';

    visit.hostNote =
      req.body.hostNote || '';

    visit.qrToken = qrToken;

    visit.qrCodeImageBase64 =
      qrCodeImageBase64;

    visit.qrGeneratedAt =
      new Date();

    visit.qrExpiresAt =
      expiresAt;


    await visit.save();


    // SEND APPROVAL EMAIL

    const guest = visit.guestId as any;


    try {
      await sendApprovalEmail({

        guestEmail: guest.email,

        guestName: guest.name,

        hostName:
          host?.name || 'Your Host',

        visitDate: visit.visitDate,

        timeSlot:
          visit.visitTimeSlot,

        qrCodeBase64:
          qrCodeImageBase64,

      });
    } catch (error) {
      console.warn('Approval email failed:', error);
    }


    return res.json({

      success: true,

      visit

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to approve visit'

    });

  }

};


// ─────────────────────────────────────────────
// REJECT VISIT
// ─────────────────────────────────────────────

export const rejectVisit = async (

  req: AuthRequest,

  res: Response

) => {

  try {

    const visit = await Visit.findOne({

      _id: req.params.id,

      hostId: req.user!.id

    })

      .populate(

        'guestId',

        'name email'

      );


    if (

      !visit ||

      visit.status !== 'PENDING'

    ) {

      return res.status(400).json({

        success: false,

        message:
          'Cannot reject this visit'

      });

    }


    const reason =
      req.body.reason ||
      'No reason provided';


    visit.status = 'REJECTED';

    visit.hostNote = reason;


    await visit.save();


    // SEND REJECTION EMAIL

    const guest = visit.guestId as any;


    try {
      await sendRejectionEmail({

        guestEmail: guest.email,

        guestName: guest.name,

        reason,

      });
    } catch (error) {
      console.warn('Rejection email failed:', error);
    }


    return res.json({

      success: true,

      visit

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to reject visit'

    });

  }

};
