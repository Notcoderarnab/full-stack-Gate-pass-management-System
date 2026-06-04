import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

import { User } from '../models/User';

import { Visit } from '../models/Visit';

import { ScanLog } from '../models/ScanLog';
import { buildQrPayload, generateQRCode } from '../services/qrService';
import { sendApprovalEmail, sendRejectionEmail } from '../services/emailService';
import { expireApprovedVisits } from '../utils/visitExpiry';


// ─────────────────────────────────────────────
// GET ADMIN DASHBOARD STATS
// ─────────────────────────────────────────────

export const getAdminStats = async (

  req: Request,

  res: Response

) => {

  try {
    await expireApprovedVisits();

    const todayStart = new Date();

    todayStart.setHours(
      0,
      0,
      0,
      0
    );


    const [

      totalUsers,

      guests,

      hosts,

      guards,

      totalVisits,

      pendingVisits,

      approvedVisits,

      rejectedVisits,

      checkedInVisits,

      expiredVisits,

      todayVisits,

      totalScans

    ] = await Promise.all([

      User.countDocuments(),

      User.countDocuments({
        role: 'GUEST'
      }),

      User.countDocuments({
        role: 'HOST'
      }),

      User.countDocuments({
        role: 'GUARD'
      }),

      Visit.countDocuments(),

      Visit.countDocuments({
        status: 'PENDING'
      }),

      Visit.countDocuments({
        status: 'APPROVED'
      }),

      Visit.countDocuments({
        status: 'REJECTED'
      }),

      Visit.countDocuments({
        status: 'CHECKED_IN'
      }),

      Visit.countDocuments({
        status: 'EXPIRED'
      }),

      Visit.countDocuments({
        visitDate: {
          $gte: todayStart
        }
      }),

      ScanLog.countDocuments(),

    ]);


    return res.json({

      success: true,

      stats: {

        totalUsers,

        guests,

        hosts,

        guards,

        totalVisits,

        pendingVisits,

        approvedVisits,

        rejectedVisits,

        checkedInVisits,

        expiredVisits,

        todayVisits,

        totalScans,

      },

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch admin stats'

    });

  }

};


// ─────────────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────────────

export const getAllUsers = async (

  req: Request,

  res: Response

) => {

  try {

    const users = await User.find()

      .select('-passwordHash')

      .sort({

        createdAt: -1

      });


    return res.json({

      success: true,

      users

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch users'

    });

  }

};


// ─────────────────────────────────────────────
// TOGGLE USER STATUS
// ─────────────────────────────────────────────

export const toggleUserStatus = async (

  req: Request,

  res: Response

) => {

  try {

    const user = await User.findById(
      req.params.id
    );


    if (!user) {

      return res.status(404).json({

        success: false,

        message: 'User not found'

      });

    }


    user.isActive = !user.isActive;


    await user.save();


    return res.json({

      success: true,

      user,

      message:
        `User ${
          user.isActive
            ? 'activated'
            : 'deactivated'
        } successfully`

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to update user'

    });

  }

};


// ─────────────────────────────────────────────
// UPDATE USER ROLE
// ─────────────────────────────────────────────

export const updateUserRole = async (

  req: Request,

  res: Response

) => {

  try {

    const { role } = req.body;


    if (

      !['GUEST', 'HOST', 'GUARD', 'ADMIN']
        .includes(role)

    ) {

      return res.status(400).json({

        success: false,

        message: 'Invalid role'

      });

    }


    const user = await User.findById(
      req.params.id
    );


    if (!user) {

      return res.status(404).json({

        success: false,

        message: 'User not found'

      });

    }


    user.role = role;


    await user.save();


    return res.json({

      success: true,

      user,

      message:
        'Role updated successfully'

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to update role'

    });

  }

};


// ─────────────────────────────────────────────
// GET ALL VISITS
// ─────────────────────────────────────────────

export const getAllVisits = async (

  req: Request,

  res: Response

) => {

  try {
    await expireApprovedVisits();

    const visits = await Visit.find()

      .populate(

        'guestId',

        'name email'

      )

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

      message:
        'Failed to fetch visits'

    });

  }

};


// ─────────────────────────────────────────────
// GET ALL SCAN LOGS
// ─────────────────────────────────────────────

export const getAllScanLogs = async (

  req: Request,

  res: Response

) => {

  try {

    const logs = await ScanLog.find()

      .populate({

        path: 'visitId',

        populate: [

          {

            path: 'guestId',

            select: 'name email'

          },

          {

            path: 'hostId',

            select: 'name department'

          },

        ],

      })

      .sort({

        createdAt: -1

      });


    return res.json({

      success: true,

      logs

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch scan logs'

    });

  }

};

export const approveVisitByAdmin = async (

  req: Request,

  res: Response

) => {

  try {

    const visit = await Visit.findById(
      req.params.id
    )
      .populate(
        'guestId',
        'name email'
      )
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

    if (visit.status !== 'PENDING') {

      return res.status(400).json({

        success: false,

        message: 'Only pending visits can be approved'

      });

    }

    const qrToken = randomUUID();
    const qrCodeImageBase64 = await generateQRCode(
      buildQrPayload(qrToken)
    );
    const expiresAt = new Date(visit.visitDate);
    expiresAt.setHours(23, 59, 59, 999);

    visit.status = 'APPROVED';
    visit.hostNote = req.body.hostNote || 'Approved by admin';
    visit.qrToken = qrToken;
    visit.qrCodeImageBase64 = qrCodeImageBase64;
    visit.qrGeneratedAt = new Date();
    visit.qrExpiresAt = expiresAt;

    await visit.save();

    const guest = visit.guestId as any;
    const host = visit.hostId as any;

    try {
      await sendApprovalEmail({
        guestEmail: guest.email,
        guestName: guest.name,
        hostName: host?.name || 'GatePass Admin',
        visitDate: visit.visitDate,
        timeSlot: visit.visitTimeSlot,
        qrCodeBase64: qrCodeImageBase64,
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

      message: 'Failed to approve visit'

    });

  }

};

export const rejectVisitByAdmin = async (

  req: Request,

  res: Response

) => {

  try {

    const visit = await Visit.findById(
      req.params.id
    ).populate(
      'guestId',
      'name email'
    );

    if (!visit || visit.status !== 'PENDING') {

      return res.status(400).json({

        success: false,

        message: 'Cannot reject this visit'

      });

    }

    const reason = req.body.reason || 'Rejected by admin';

    visit.status = 'REJECTED';
    visit.hostNote = reason;

    await visit.save();

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

      message: 'Failed to reject visit'

    });

  }

};
