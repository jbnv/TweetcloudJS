// Twitter returns the date as WWW, DD MMM YYYY HH:MM:SS -ZZZZ.
    
function formatDateFromTwitter(s)
{
    var aPieces = s.split(" ");

    var date = new Date(aPieces[2]+" "+aPieces[1]+", "+aPieces[3]+" "+aPieces[4] || "");
    var diff = (((new Date()).getTime() - date.getTime()) / 1000);
    var day_diff = Math.floor(diff / 86400);
    
    return ""+
     day_diff == 0 && (
     diff < 60 && "just now" ||
     diff < 120 && "1 minute ago" ||
     diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
     diff < 7200 && "1 hour ago" ||
     diff < 86400 && Math.floor( diff / 3600 ) + " hours ago"
     ) ||
     day_diff == 1 && "yesterday" ||
     day_diff + " days ago";
}
