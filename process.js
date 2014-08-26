function processText(s)
 {
    
 s = s.toLowerCase();
    
 s = s.replace(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g,' '); // remove URLs
   
 s = s.replace(/&amp;apos;/,'\'');
    
 s = s.replace(/n\'t\b/g,' ');
 s = s.replace(/\'s\b/g,' ');
 s = s.replace(/s\'\b/g,' ');
 s = s.replace(/[.,\/]/g,' '); // replace certain punctuation with spaces
    
 s = s.replace(/\W\W+/g,' '); // coalesce white space and punctuation
    
 //s = s.replace(/\b\w\w?\b/g,' '); // remove 1- and 2- letter words
    
 return(s);

}



function processWord(pWord) 
{
  
 if (pWord.length <= 2) return '';
  
 _.each(gaFilter, function(pFilter) { pWord = pWord.replace(pFilter.exp,pFilter.rep); } );

 return pWord;

}
