const UserDto = require('../models/UserDto');

class UserMapper {
  static mapToDto(userModel) {
    return new UserDto(userModel.username, userModel.email,'',active);
  }
}

module.exports = UserMapper;