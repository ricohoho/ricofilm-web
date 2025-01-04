class RequestDto {


   constructor(file, path, size,username,title,serveur_name,status) {
    this.file = file;
    this.path = path;
    this.size = size;
    this.username = username;
    this.title = title;
    this.serveur_name = serveur_name;
    this.status = status;
  };
    
}
module.exports = RequestDto;
