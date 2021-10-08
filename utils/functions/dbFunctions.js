module.exports = {
    isMember
}

function isMember(dBUser) {
    if (dBUser.firstName && dBUser.lastName && dBUser.school && dBUser.schoolYear) return true;
    return false;
}
