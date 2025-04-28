import bcrypt from 'bcrypt';
const args = process.argv
const salt = 10 


function encrypt(user, pass){
    const hashedUser = await bcrypt.hash(parseString(user),salt);
    const hashedPass = await bcrypt.hash(parseString(pass),salt);

    console.log(`Username:${hashedUser}    Password:${hashedPass}`);
    return
}
