# InteractiveVideo
ILIAS Interactive Video Plugin

## Installation Instructions
1. Clone this repository to <ILIAS_DIRECTORY>/Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo
2. Login to ILIAS with an administrator account (e.g. root)
3. Select **Plugins** from the **Administration** main menu drop down.
4. Search the **InteractiveVideo** plugin in the list of plugin and choose **Activate** from the **Actions** drop down.

###Workaround patch for making the Interactive Videos work with the Web Access Checker
Simply insert the following line into the file 'Services/MediaObjects/classes/class.ilObjMediaObject.php' at round about line number 1397, which should read like this in the original:

	case "mep":
		$obj_id = $id;
		break;

Insert     case "xvid":    to make it read like this:

	case "mep":
	case "xvid":
		$obj_id = $id;
		break;

That's it.

# What is it for?
The InteractiveVideo Plugin for ILIAS gives you the possibility to create a video object, where your students can communicate in a asynchronous way. Please note that this is *NOT* a chat. They can leave notes on different timestamps in the video for other students to read, or only for themselves. Further a tutor can insert questions on various positions in the video for the students to answer. At the moment three questions types are supported single and multiple choice and a reflective type. 

#Interactive Video Main View
![Main View](http://gvollbach.github.io/InteractiveVideo/images/main_view.png)

#Interactive Video Question View
![Question View](http://gvollbach.github.io/InteractiveVideo/images/view_question.png)

#Interactive Video Create Comment Tutor View
![Create Comment Tutor View](http://gvollbach.github.io/InteractiveVideo/images/create_comment.png)

#Interactive Video Create Question
![Create Question](http://gvollbach.github.io/InteractiveVideo/images/create_question.png)
