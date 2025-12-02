import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
// import * as submissionQueries from '../queries/submissionQueries';
import * as userQueries from '../queries/userQueries';

const router = express.Router();

// GET user profile by uid
router.get('/:uid', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const uid = parseInt(req.params.uid);
      
      // Check if user is viewing their own profile or is admin
      if (req.user?.uid !== uid && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to view this profile' });
      }
  
      const user = await userQueries.getUserByUid(uid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Don't return password in response
      const userResponse: any = user.toObject();
      delete userResponse.password;
      
      return res.json({ user: userResponse });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// UPDATE user profile
router.patch('/:uid', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const uid = parseInt(req.params.uid);
      
      // Check if user is updating their own profile (or is admin)
      if (req.user?.uid !== uid && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to update this profile' });
      }
  
      // Don't allow updating sensitive fields
      const { password, email, role, uid: _, ...allowedUpdates } = req.body;
      
      const updatedUser = await userQueries.updateUser(uid, allowedUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Don't return password in response
      const userResponse: any = updatedUser.toObject();
      delete userResponse.password;
      
      return res.json({ 
        message: 'User updated successfully',
        user: userResponse 
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE user account
router.delete('/:uid', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const uid = parseInt(req.params.uid);
      
      // Check if user is deleting their own account or is admin
      if (req.user?.uid !== uid && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to delete this account' });
      }
  
      const deletedUser = await userQueries.deleteUser(uid);
      
      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      return res.json({ 
        message: 'User account deleted successfully',
        uid: uid 
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
});


export default router;