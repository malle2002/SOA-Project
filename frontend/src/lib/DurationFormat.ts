const DurationFormat = (duration:number):string => {
    var hours = Math.floor(duration/60)
    var minutes = duration%60
    if (hours>=1 && minutes>=1){
        return `${hours}h ${minutes}m`
    }else if(hours>=1) {
        return `${hours}h`
    }else return `${minutes}m`
    
}
export default DurationFormat;

