if(current day opening hours undefined)
    check previous day
    if previous day undefined) {offer paused, case 1}
    else // current day undefined, prev. day defined
        check prev. day closing hours
        if  (prev. day closes after midnight)
            check wheter prev. day set current day to active or not
            if(prev. day set offer to active)
            {offer active, case 2}
        else {prev. day ends before midnight or after midnight but already closed, offer paused, case 3}

else //current day opening and closing hours defined
    if(closing=00:00) {change format to 24:00}
    if(prev. day closing hour after midnight)
        if(current hour is before opening hours) {offer active, case 4}
        else //curent hour is before opening for current day
            but still previous day offer might set it to active
            when prev. day ends after midnight

            check wheter prev. day opening-closing hours is not empty
            if(prev. day hours undefined){
                offer paused, case 5
            }
            else 
                read opening-closing hours for prev. day
                if(prev. day closes after midnight and now is before closing hour for prev. day)
                    {offer active, case 6}
                else //prev day ends before midnight or now is after closing hour for prev. day
                    {offer paused, case 7}
    else // offer ends before midnight
    if (now between opening and closing)
        {case 11, offer active}
        else // now not between opening and closing
            check wheter prev. day opening hours undefined
            if(prev. day opening hours undefined) {case 8, offer paused}
            else 
                read opening closing hours for prev. day
                if(prev. day ends after midnight and now is before prev. day closing hours)
                    {case 9, offer active}
                else {case 10, offer paused} //previous day ends before midnight or now is after closing hours for prev. day



                    





