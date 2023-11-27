const db = require('../db');
const bcrypt = require('bcrypt');
const { NotFoundError } = require('../expressError');

/** User class for message.ly */

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    // hash the password before storing 
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users
      (username, password, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING username, password, first_name, last_name, phone`, 
      [username, hashedPassword, first_name, last_name, phone]
    );
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(
      'SELECT password
      FROM users 
      WHERE username=$1',
      [username]
    );
    const user = result.rows[0];

    if (user){
      return await bcrypt.compare(password, user.password);
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
      'UPDATE users 
      SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING last_login_at',
      [username]
    );

    if(!result.rows[0]) throw new NotFoundError('No such user: ${username}');

    return result.rows[0].last_login_at;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query (
      'SELECT username, first_name, last_name, phone
      FROM users'
    ); 

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  
  

  static async get(username) { 
    const result = await db.query(
      'SELECT username, first_name, last_name, phone, join_at, last_login_at 
      FROM users
      WHERE username = $1',
      [username]);

      const user = result.rows[0];

      if (!user) throw new NotFoundError('No such user: ${username}');

      return user; 
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const result = await db.query(
      'SELECT id, to_user, body, sent_at, read_at
      FROM messages 
      WHERE from_user = $1',
      [username]
    );
    
    const messages = result.rows;

    const messagesWithToUser = messages.map(message => ({
      id: message.id, 
      to_user: {
        username: message.to_user,
        first_name: message.to_user,
        first_name: message.to_first_name,
        last_name: message.to_last_name,
        phone: message.to_phone
      },
      body: message.body,
      sent_at: message.sent_at,
      read_at: message.read_at
    }));

    return messagesWithToUser; 
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const result = await db.query(
      'SELECT id, from_user, body, sent_at, read_at
      FROM messages 
      WHERE to_user = $1',
      [username]
    );

    const messages = result.rows;

  //assuming from_user is an object with username, first_name, last_name, etc.
    const messagesWithFromUser = messages.map(message => ({
      id: message.id,
      from_user: {
        username: message.from_user,
        first_name: message.from_first_name,
        last_name: message.from_last_name,
        phone: message.from_phone
      }, 
      body: message.body,
      sent_at: message.sent_at,
      read_at: message.read_at
    }));

    return messagesWithFromUser;
  }
}  


module.exports = User;